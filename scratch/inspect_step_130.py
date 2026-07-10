import json

log_file = r"C:\Users\Admin\.gemini\antigravity\brain\d8c78017-0388-4f6b-9b30-58ec8afd0f87\.system_generated\logs\transcript.jsonl"
steps = [114, 118, 120, 130, 136, 140, 148, 160, 170]

def clean_escapes(s):
    if not s:
        return ""
    orig = s
    if s.startswith('"') and s.endswith('"'):
        s = s[1:-1]
    s = s.replace("\\\\", "\\")
    s = s.replace("\\n", "\n")
    s = s.replace("\\r", "\r")
    s = s.replace("\\t", "\t")
    s = s.replace('\\"', '"')
    s = s.replace("\\'", "'")
    return s

with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if step_idx in steps:
                tool_calls = data.get("tool_calls", [])
                for call in tool_calls:
                    if "replace_file_content" in call.get("name") or "multi_replace_file_content" in call.get("name"):
                        args = call.get("args", {})
                        if "TargetContent" in args:
                            target = args["TargetContent"]
                            replacement = args["ReplacementContent"]
                            clean_t = clean_escapes(target)
                            clean_r = clean_escapes(replacement)
                            print(f"\n--- Step {step_idx} ---")
                            print("Target starts with quotes:", target.startswith('"'), target.endswith('"'))
                            print("Replacement starts with quotes:", replacement.startswith('"'), replacement.endswith('"'))
                            print("Clean target starts with quote:", clean_t.startswith('"'))
                            print("Clean replacement starts with quote:", clean_r.startswith('"'))
                            # Print first line of clean target and replacement
                            print("Clean Target Line 1:", repr(clean_t.splitlines()[0] if clean_t.splitlines() else ""))
                            print("Clean Replacement Line 1:", repr(clean_r.splitlines()[0] if clean_r.splitlines() else ""))
        except Exception as e:
            pass
