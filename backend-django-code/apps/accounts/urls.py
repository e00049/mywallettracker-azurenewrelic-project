from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import ApiRootView, HealthCheckView, LoginView, MeView, RegisterView

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    # Built-in SimpleJWT views — no custom code needed
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("health/", HealthCheckView.as_view(), name="health"),
]
