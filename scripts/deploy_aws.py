import os
import tarfile
import tempfile
import subprocess
import sys

sys.stdout.reconfigure(line_buffering=True)

HOST = "52.2.46.57"
USER = "ec2-user"
KEY_PATH = r"C:\Users\bhask\.ssh\proofsy_key.pem"
REMOTE_PATH = "/var/www/proofsy"

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def make_tarfile(output_filename, source_dir):
    def filter_func(tarinfo):
        name = tarinfo.name.replace("\\", "/")
        basename = os.path.basename(name)
        if basename in ["node_modules", ".git", "storage", "combined.log", "error.log", "cache", "uploads"]:
            return None
        if "/.next/cache" in name or name.endswith("/cache") or name.endswith(".tar.gz") or name.endswith(".mp4") or name.endswith(".log"):
            return None
        if basename.startswith(".env") and not basename.endswith(".example"):
            return None
        return tarinfo

    with tarfile.open(output_filename, "w:gz") as tar:
        print("  -> Adding backend to archive...", flush=True)
        tar.add(os.path.join(source_dir, "backend"), arcname="backend", filter=filter_func)
        print("  -> Adding frontend & production .next to archive...", flush=True)
        tar.add(os.path.join(source_dir, "frontend"), arcname="frontend", filter=filter_func)
        if os.path.exists(os.path.join(source_dir, "enterprise_documents")):
            tar.add(os.path.join(source_dir, "enterprise_documents"), arcname="enterprise_documents", filter=filter_func)

print("[1/5] Creating optimized production archive with pre-compiled Next.js...", flush=True)
temp_tar = os.path.join(tempfile.gettempdir(), "proofsy_prod_bundle.tar.gz")
make_tarfile(temp_tar, workspace_root)
tar_size_mb = os.path.getsize(temp_tar) / (1024 * 1024)
print(f"Archive created: {temp_tar} ({tar_size_mb:.2f} MB)", flush=True)

print("[2/5] Uploading deployment archive via SCP...", flush=True)
scp_cmd = [
    "scp",
    "-i", KEY_PATH,
    "-o", "StrictHostKeyChecking=no",
    temp_tar,
    f"{USER}@{HOST}:/tmp/proofsy_prod_bundle.tar.gz"
]
subprocess.run(scp_cmd, check=True)
print("Upload completed.", flush=True)

print("[3/5] Extracting release and deploying on AWS EC2...", flush=True)
remote_script = """
set -e
echo "=== Backing up environment files ==="
cp /var/www/proofsy/backend/.env /tmp/backend.env.bak 2>/dev/null || true
cp /var/www/proofsy/frontend/.env.local /tmp/frontend.env.bak 2>/dev/null || true

echo "=== Extracting production bundle to /var/www/proofsy ==="
tar -xzf /tmp/proofsy_prod_bundle.tar.gz -C /var/www/proofsy

echo "=== Restoring environment files ==="
cp /tmp/backend.env.bak /var/www/proofsy/backend/.env 2>/dev/null || true
cp /tmp/frontend.env.bak /var/www/proofsy/frontend/.env.local 2>/dev/null || true

echo "=== Ensuring backend dependencies ==="
cd /var/www/proofsy/backend
npm install --omit=dev --no-audit

echo "=== Ensuring frontend dependencies ==="
cd /var/www/proofsy/frontend
npm install --omit=dev --no-audit

echo "=== Restarting PM2 Production Cluster ==="
pm2 restart all

echo "=== Waiting for services to initialize ==="
sleep 4
pm2 status
"""

ssh_cmd = [
    "ssh",
    "-i", KEY_PATH,
    "-o", "StrictHostKeyChecking=no",
    f"{USER}@{HOST}",
    remote_script
]
p = subprocess.run(ssh_cmd)

if p.returncode == 0:
    print("\n[4/5] Performing live verification checks on production endpoints...", flush=True)
    health_cmd = [
        "ssh",
        "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        f"{USER}@{HOST}",
        "curl -s http://127.0.0.1:5000/api/health; echo ''; curl -s -I http://127.0.0.1:3000 | head -n 5"
    ]
    subprocess.run(health_cmd)
    print("\n========================================================================")
    print("✓ SUCCESS: Production deployment on AWS completed! (https://proofsy.tech)")
    print("========================================================================")
else:
    print("\n❌ Deployment failed. Check the error output above.")
