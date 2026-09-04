from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.reverse import reverse

from .serializers import LoginSerializer, RegisterSerializer


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class RegisterView(APIView):
    """
    POST /api/v1/register/
    Body: {"username", "email", "password", "password_confirm"}
    Returns the new user plus JWT tokens, so the frontend can log them
    straight in without a second round-trip.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/v1/login/ -> returns JWT access + refresh tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(_tokens_for(user))


class MeView(APIView):
    """
    GET /api/v1/me/
    Returns the currently authenticated user. Useful for the React app to
    restore session state on page refresh using a stored access token.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({"id": u.id, "username": u.username, "email": u.email})


class HealthCheckView(APIView):
    """GET /api/v1/health/ -> for AKS liveness/readiness probes."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class ApiRootView(APIView):
    """GET /api/v1/ -> lists the available endpoints."""
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        return Response({
            "register": reverse("register", request=request, format=format),
            "login": reverse("login", request=request, format=format),
            "me": reverse("me", request=request, format=format),
            "token_refresh": reverse("token_refresh", request=request, format=format),
            "token_verify": reverse("token_verify", request=request, format=format),
            "health": reverse("health", request=request, format=format),
        })
