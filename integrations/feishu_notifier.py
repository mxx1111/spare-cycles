import os
import json
import urllib.request

def notify_feishu(title: str, text_content: str) -> bool:
    webhook_url = os.environ.get('FEISHU_WEBHOOK')
    if not webhook_url:
        return False
    payload = {
        "msg_type": "interactive",
        "card": {
            "header": {"title": {"tag": "plain_text", "content": title}, "template": "turquoise"},
            "elements": [{"tag": "div", "text": {"tag": "lark_md", "content": text_content}}]
        }
    }
    try:
        req = urllib.request.Request(webhook_url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False