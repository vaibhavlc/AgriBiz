import json

log_file = r"C:\Users\Admin\.gemini\antigravity\brain\d8c78017-0388-4f6b-9b30-58ec8afd0f87\.system_generated\logs\transcript.jsonl"
sales_file = r"c:\Users\Admin\Desktop\AgriBiz\src\pages\Sales.tsx"

with open(sales_file, "r", encoding="utf-8") as f:
    sales_content = f.read().replace("\r\n", "\n")

with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") == 130:
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                args = call.get("args", {})
                target = json.loads(args["TargetContent"]).replace("\r\n", "\n")
                print("Target in sales_content?", target in sales_content)
                if target not in sales_content:
                    # check why
                    # find where handleDownload is defined in sales_content
                    idx = sales_content.find("const handleDownload = () =>")
                    if idx != -1:
                        print("Found 'const handleDownload = () =>' in file. Let's show 200 chars:")
                        print(repr(sales_content[idx:idx+400]))
                    else:
                        print("Could not find 'const handleDownload = () =>' in file at all.")
                    print("First 200 chars of target:")
                    print(repr(target[:200]))
