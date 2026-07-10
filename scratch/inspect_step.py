import json

log_file = r"C:\Users\Admin\.gemini\antigravity\brain\d8c78017-0388-4f6b-9b30-58ec8afd0f87\.system_generated\logs\transcript.jsonl"
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("step_index") == 136:
                print("RAW LINE:")
                print(line[:300]) # Print first 300 chars of raw line
                print("...")
                print(line[-300:]) # Print last 300 chars of raw line
        except Exception as e:
            pass
