from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Public data access
    path('public-data/', views.public_user_data, name='public_user_data'),
    

    
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('google-login/', views.google_login, name='google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='profile_update'),
    path('profile/complete/', views.get_user_profile, name='profile_complete'),
    
    # Onboarding
    path('onboarding/step/', views.update_onboarding_step, name='onboarding_step'),
    path('onboarding/complete/', views.complete_onboarding, name='onboarding_complete'),
    
    # Body data
    path('body-composition/', views.update_body_composition, name='body_composition'),
    path('measurements/', views.update_body_measurements, name='measurements'),
    path('goal-measurements/', views.update_goal_measurements, name='goal_measurements'),
] 