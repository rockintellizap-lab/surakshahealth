import re
with open('src/components/profile/ProfileView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line numbers to remove
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '// Show success/approval flow after save' in line:
        start_line = i
    if start_line is not None and '  return (' in line and i > start_line + 200:
        end_line = i
        break

print(f"Start: {start_line}, End: {end_line}")

if start_line is not None and end_line is not None:
    # Remove the block
    new_lines = lines[:start_line] + lines[end_line:]
    with open('src/components/profile/ProfileView.tsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Removed lines {start_line+1} to {end_line}")
else:
    print("Could not find block to remove")