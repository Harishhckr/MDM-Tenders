import sys
sys.path.append('c:/Users/LEONEX/Desktop/UI/backend')

try:
    from app.ai.routes.chat_routes import router
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
