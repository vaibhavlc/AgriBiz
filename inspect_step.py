import json
log_file = r"C:\Users\Admin\.gemini\antigravity\brain\d8c78017-0388-4f6b-9b30-58ec8afd0f87\.system_generated\logs\transcript.jsonl"

with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") == 114:
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                args = call.get("args", {})
                tc = args.get("TargetContent")
                print("TYPE:", type(tc))
                print("REPR:", repr(tc))
                if isinstance(tc, str):
                    print("FIRST 50 chars:", repr(tc[:50]))
