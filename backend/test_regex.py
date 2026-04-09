import re

def parse_n8n_amount_template(amount: str, t_cal: int) -> str:
    if not isinstance(amount, str) or '<%' not in amount:
        return amount
    try:
        matches = re.finditer(r'(?:if\s*\(\$json\.target_calories\s*(<=|<|>|>=|==)\s*(\d+)\)\s*\{|else\s*\{)\s*print\([\'"]([^\'"]+)[\'"]\);?\s*\}', amount)
        for match in matches:
            operator = match.group(1)
            val_str = match.group(2)
            print_val = match.group(3)
            
            if operator and val_str:
                val = int(val_str)
                if operator == '<=' and t_cal <= val: return print_val
                elif operator == '<' and t_cal < val: return print_val
                elif operator == '>=' and t_cal >= val: return print_val
                elif operator == '>' and t_cal > val: return print_val
                elif operator == '==' and t_cal == val: return print_val
            else:
                return print_val
        
        fb = re.search(r'else\s*\{\s*print\([\'"]([^\'"]+)[\'"]\)', amount)
        if fb: return fb.group(1)
    except Exception as e:
        print(f"Error parsing amount template: {amount} -> {e}")
    return amount

test_amount = "<% if ($json.target_calories <= 1600) { print('1 adet'); } else if ($json.target_calories <= 2200) { print('2 adet'); } else { print('3 adet'); } %>"

print("Test <= 1600 (e.g. 1500):", parse_n8n_amount_template(test_amount, 1500))
print("Test <= 2200 (e.g. 2000):", parse_n8n_amount_template(test_amount, 2000))
print("Test > 2200  (e.g. 2500):", parse_n8n_amount_template(test_amount, 2500))
