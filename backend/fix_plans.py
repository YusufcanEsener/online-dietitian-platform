import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User, Dietitian, Member
from app.models.nutrition_plan import NutritionPlan

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
        pass
    return amount

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[User, Dietitian, Member, NutritionPlan]
    )
    
    plans = await NutritionPlan.find_all().to_list()
    fixed_count = 0
    for plan in plans:
        modified = False
        t_cal = plan.daily_targets.calories if plan.daily_targets else 2000
        
        for meal in plan.meals:
            for food in meal.foods:
                amt = food.amount
                if amt and '<%' in amt:
                    clean_amt = parse_n8n_amount_template(amt, t_cal)
                    if clean_amt != amt:
                        food.amount = clean_amt
                        modified = True
                        
        if modified:
            await plan.save()
            fixed_count += 1
            print(f"Fixed plan {plan.id}")
            
    print(f"Done. Fixed {fixed_count} plans.")

if __name__ == "__main__":
    asyncio.run(main())
