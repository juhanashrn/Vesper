import os
import time


import os

os.environ["HTTP_PROXY"] = ""
os.environ["HTTPS_PROXY"] = ""
os.environ["http_proxy"] = ""
os.environ["https_proxy"] = ""
os.environ["ALL_PROXY"] = ""
os.environ["NO_PROXY"] = "*"
# ✅ Do NOT set base manually
zap = ZAPv2(apikey='')

target = "https://example.com"

print("Starting scan on:", target)

try:
    print("Starting Spider...")
    scan_id = zap.spider.scan(target)

    while int(zap.spider.status(scan_id)) < 100:
        print("Spider progress:", zap.spider.status(scan_id))
        time.sleep(2)

    print("Spider completed!")

    print("Starting Attack...")
    scan_id = zap.ascan.scan(target)

    while int(zap.ascan.status(scan_id)) < 100:
        print("Attack progress:", zap.ascan.status(scan_id))
        time.sleep(5)

    print("Attack completed!")

    alerts = zap.core.alerts()

    print("\n=== RESULTS ===\n")

    for alert in alerts:
        print("Issue:", alert['alert'])
        print("Risk:", alert['risk'])
        print("-" * 40)

except Exception as e:
    print("Error occurred:", e)