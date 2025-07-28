from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from google.auth.transport import requests
from google.oauth2 import id_token
from django.conf import settings
from .models import User, BodyComposition, BodyMeasurements, GoalMeasurements
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRegistrationSerializer,
    UserLoginSerializer, BodyCompositionSerializer, BodyMeasurementsSerializer,
    GoalMeasurementsSerializer, UserCompleteProfileSerializer, OnboardingStepSerializer
)

class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

    def get(self, request, *args, **kwargs):
        """GET method for debugging - shows registration form data"""
        return Response({
            'message': 'Registration endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'User Registration',
            'expected_data': {
                'email': 'string',
                'password': 'string', 
                'username': 'string',
                'first_name': 'string',
                'last_name': 'string'
            }
        })

class UserLoginView(generics.GenericAPIView):
    """User login endpoint"""
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Login successful'
        })

    def get(self, request):
        """GET method for debugging - shows login form data"""
        return Response({
            'message': 'Login endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'User Login',
            'expected_data': {
                'email': 'string',
                'password': 'string'
            }
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserCompleteProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserProfileUpdateView(generics.UpdateAPIView):
    """Update user profile during onboarding"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Update user profile
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Profile updated successfully'
        })

    def patch(self, request, *args, **kwargs):
        """Handle PATCH requests for partial updates"""
        return self.update(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        """Handle PUT requests for full updates"""
        return self.update(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        """GET method for debugging - shows profile update form data"""
        return Response({
            'message': 'Profile Update endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'User Profile Update',
            'expected_data': {
                'height': 'decimal',
                'weight': 'decimal',
                'gender': 'string (male/female/other)',
                'age': 'integer',
                'fitness_level': 'string',
                'fitness_goal': 'string',
                'specific_goal': 'string'
            }
        })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow GET without auth for debugging
def update_onboarding_step(request):
    """Update user onboarding progress"""
    if request.method == 'GET':
        return Response({
            'message': 'Onboarding Step endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Update Onboarding Step',
            'expected_data': {
                'step': 'string (profile/goals/body_composition/body_model/specific_goals)',
                'data': 'object (varies by step)'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = OnboardingStepSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    step = serializer.validated_data['step']
    data = serializer.validated_data['data']
    user = request.user
    
    with transaction.atomic():
        if step == 'profile':
            # Update basic profile
            user.height = data.get('height')
            user.weight = data.get('weight')
            user.gender = data.get('gender')
            user.save()
            
        elif step == 'goals':
            # Update fitness goals
            user.fitness_goal = data.get('fitness_goal')
            user.save()
            
        elif step == 'body_composition':
            # Create or update body composition
            composition, created = BodyComposition.objects.get_or_create(user=user)
            for field, value in data.items():
                if hasattr(composition, field) and value is not None:
                    setattr(composition, field, value)
            composition.save()
            
        elif step == 'body_model':
            # Create or update body measurements
            measurements, created = BodyMeasurements.objects.get_or_create(user=user)
            for field, value in data.items():
                if hasattr(measurements, field) and value is not None:
                    setattr(measurements, field, value)
            measurements.save()
            
        elif step == 'specific_goals':
            # Update specific goal and complete onboarding
            user.specific_goal = data.get('specific_goal')
            user.has_completed_onboarding = True
            user.save()
    
    return Response({
        'message': f'{step} step completed successfully',
        'user': UserSerializer(user).data
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow GET without auth for debugging
def update_body_composition(request):
    """Update user body composition"""
    if request.method == 'GET':
        return Response({
            'message': 'Body Composition endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Update Body Composition',
            'expected_data': {
                'body_fat': 'decimal',
                'muscle_mass': 'decimal',
                'bone_mass': 'decimal',
                'water_weight': 'decimal',
                'bmr': 'integer',
                'visceral_fat': 'decimal',
                'protein_mass': 'decimal',
                'bmi': 'decimal',
                'muscle_rate': 'decimal',
                'metabolic_age': 'integer',
                'weight_without_fat': 'decimal',
                'composition_image': 'file'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    composition, created = BodyComposition.objects.get_or_create(user=user)
    
    serializer = BodyCompositionSerializer(composition, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    composition = serializer.save()
    
    return Response({
        'body_composition': BodyCompositionSerializer(composition).data,
        'message': 'Body composition updated successfully'
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow GET without auth for debugging
def update_body_measurements(request):
    """Update user body measurements"""
    if request.method == 'GET':
        return Response({
            'message': 'Body Measurements endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Update Body Measurements',
            'expected_data': {
                'chest': 'decimal',
                'neck': 'decimal',
                'waist': 'decimal',
                'left_arm': 'decimal',
                'right_arm': 'decimal',
                'left_thigh': 'decimal',
                'right_thigh': 'decimal',
                'shoulders': 'decimal',
                'hips': 'decimal',
                'calves': 'decimal'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    measurements, created = BodyMeasurements.objects.get_or_create(user=user)
    
    serializer = BodyMeasurementsSerializer(measurements, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    measurements = serializer.save()
    
    return Response({
        'measurements': BodyMeasurementsSerializer(measurements).data,
        'message': 'Body measurements updated successfully'
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow GET without auth for debugging
def update_goal_measurements(request):
    """Update user goal measurements"""
    if request.method == 'GET':
        return Response({
            'message': 'Goal Measurements endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Update Goal Measurements',
            'expected_data': {
                'chest': 'decimal',
                'neck': 'decimal',
                'waist': 'decimal',
                'left_arm': 'decimal',
                'right_arm': 'decimal',
                'left_thigh': 'decimal',
                'right_thigh': 'decimal',
                'shoulders': 'decimal',
                'hips': 'decimal',
                'calves': 'decimal',
                'target_weight': 'decimal'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    goals, created = GoalMeasurements.objects.get_or_create(user=user)
    
    serializer = GoalMeasurementsSerializer(goals, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    goals = serializer.save()
    
    return Response({
        'goal_measurements': GoalMeasurementsSerializer(goals).data,
        'message': 'Goal measurements updated successfully'
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get complete user profile with all related data"""
    user = request.user
    serializer = UserCompleteProfileSerializer(user)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow GET without auth for debugging
def complete_onboarding(request):
    """Mark onboarding as complete"""
    if request.method == 'GET':
        return Response({
            'message': 'Complete Onboarding endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Complete Onboarding',
            'expected_data': 'No data required - just POST request'
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    user.has_completed_onboarding = True
    user.save()
    
    return Response({
        'message': 'Onboarding completed successfully',
        'user': UserSerializer(user).data
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def google_login(request):
    """Handle Google OAuth login"""
    if request.method == 'GET':
        return Response({
            'message': 'Google Login endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Google Login',
            'expected_data': {
                'id_token': 'string (Google ID token)'
            }
        })
    
    try:
        id_token_data = request.data.get('id_token')
        if not id_token_data:
            return Response({
                'error': 'ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            id_token_data, 
            requests.Request(), 
            '876432031351-h5hmbv4qj96aci5ngcrfqa4kdvef24s2.apps.googleusercontent.com'
        )
        
        # Extract user information
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        # Check if user exists, create if not
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name or name,
                'last_name': last_name,
                'is_active': True,
            }
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Google login successful',
            'is_new_user': created
        })
        
    except ValueError as e:
        return Response({
            'error': 'Invalid ID token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Google login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
