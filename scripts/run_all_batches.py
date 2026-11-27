import os, sys, subprocess, time

batches = ['02-merchant', '03-courier', '04-ops-staff', '05-admin', '06-customer']

for b in batches:
    print(f"\n==========================================")
    print(f"  RUNNING BATCH: {b}")
    print(f"==========================================")
    res = subprocess.run([sys.executable, "scripts/run_batch_generator.py", b])
    if res.returncode != 0:
        print(f"FAILED on batch {b}!")
        sys.exit(1)
    time.sleep(1)

print("\nALL BATCHES COMPLETED SUCCESSFULLY!")
