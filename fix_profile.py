import re
with open('src/components/profile/ProfileView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the entire success flow block
pattern = r'// Show success/approval flow after save\s+if \(saveStatus === "success"\) \{\s+return \(\s+<section id="profile" className="pf">.*?\);\s+  \}\s+  \}\s+  return \('
content = re.sub(pattern, 'return (', content, flags=re.DOTALL)

with open('src/components/profile/ProfileView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')