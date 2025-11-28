from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.conf import settings
import jwt
from .models import User

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        try:
            token = auth_header.split()[1]
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get('sub') or payload.get('user_id')
            user = User.objects.get(id=user_id)
            return (user, None)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expired')
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid token')

def verify_internal_token(request):
    token = request.headers.get('x-internal-token')
    return token == settings.SERVICE_A_INTERNAL_TOKEN
