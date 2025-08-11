from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from google.auth.transport import requests
from google.oauth2 import id_token
from django.conf import settings
from datetime import datetime
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
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Registration request received: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        logger.info(f"User registered successfully: {user.email}")
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user data with serializer
        user_data = UserSerializer(user).data
        logger.info(f"User data being sent to frontend: {user_data}")
        logger.info(f"hasCompletedOnboarding value: {user_data.get('hasCompletedOnboarding')}")
        
        response_data = {
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'User registered successfully'
        }
        
        logger.info(f"Registration successful for user: {user.email}")
        logger.info(f"Full response data: {response_data}")
        return Response(response_data, status=status.HTTP_201_CREATED)

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
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Login request received: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        logger.info(f"User authenticated successfully: {user.email}")
        
        refresh = RefreshToken.for_user(user)
        
        # Get user data with serializer
        user_data = UserSerializer(user).data
        logger.info(f"User data being sent to frontend: {user_data}")
        logger.info(f"hasCompletedOnboarding value: {user_data.get('hasCompletedOnboarding')}")
        
        response_data = {
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Login successful'
        }
        
        logger.info(f"Login successful for user: {user.email}")
        logger.info(f"Full response data: {response_data}")
        return Response(response_data)

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
    
    def get(self, request, *args, **kwargs):
        """GET method to retrieve user profile"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Profile GET request from user: {request.user}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    def put(self, request, *args, **kwargs):
        """PUT method to update user profile"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Profile PUT request from user: {request.user}")
        logger.info(f"Request data: {request.data}")
        
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializer.data)
    
    def patch(self, request, *args, **kwargs):
        """PATCH method to partially update user profile"""
        return self.put(request, *args, **kwargs)

class UserProfileUpdateView(generics.UpdateAPIView):
    """Update user profile during onboarding"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        user = self.get_object()
        logger.info(f"Updating profile for user: {user.email}")
        logger.info(f"Request data: {request.data}")
        
        # Handle field mapping from frontend to backend
        update_data = {}
        field_mapping = {
            'height': 'height',
            'weight': 'weight',
            'gender': 'gender',
            'age': 'age',
            'fitness_level': 'fitness_level',
            'fitnessGoal': 'fitness_goal',
            'specificGoal': 'specific_goal',
            'hasCompletedOnboarding': 'has_completed_onboarding'
        }
        
        for frontend_field, backend_field in field_mapping.items():
            if frontend_field in request.data and request.data[frontend_field] is not None:
                update_data[backend_field] = request.data[frontend_field]
        
        logger.info(f"Mapped update data: {update_data}")
        
        serializer = self.get_serializer(user, data=update_data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Update user profile directly in database
        user = serializer.save()
        
        logger.info(f"Profile updated successfully for user: {user.email}")
        
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
    
    import logging
    logger = logging.getLogger(__name__)
    
    serializer = OnboardingStepSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    step = serializer.validated_data['step']
    data = serializer.validated_data['data']
    user = request.user
    
    logger.info(f"Processing onboarding step '{step}' for user {user.email}")
    logger.info(f"Step data: {data}")
    
    # Save data directly to database
    try:
        if step == 'profile':
            # Update basic profile information
            if 'height' in data and data['height'] is not None:
                user.height = data['height']
            if 'weight' in data and data['weight'] is not None:
                user.weight = data['weight']
            if 'gender' in data and data['gender'] is not None:
                user.gender = data['gender']
            if 'age' in data and data['age'] is not None:
                user.age = data['age']
            if 'fitness_level' in data and data['fitness_level'] is not None:
                user.fitness_level = data['fitness_level']
            user.save()
            logger.info(f"Profile data saved directly for user {user.email}")
            
        elif step == 'goals':
            # Update fitness goals
            if 'fitnessGoal' in data and data['fitnessGoal'] is not None:
                user.fitness_goal = data['fitnessGoal']
            if 'specificGoal' in data and data['specificGoal'] is not None:
                user.specific_goal = data['specificGoal']
            user.save()
            logger.info(f"Goals data saved directly for user {user.email}")
            
        elif step == 'body_composition':
            # Update body composition data
            body_comp, created = BodyComposition.objects.get_or_create(user=user)
            field_mapping = {
                'bodyFat': 'body_fat',
                'muscleMass': 'muscle_mass',
                'boneMass': 'bone_mass',
                'waterWeight': 'water_weight',
                'visceralFat': 'visceral_fat',
                'proteinMass': 'protein_mass',
                'muscleRate': 'muscle_rate',
                'metabolicAge': 'metabolic_age',
                'weightWithoutFat': 'weight_without_fat',
                'bmi': 'bmi',
                'bmr': 'bmr'
            }
            
            updated_fields = []
            for frontend_field, backend_field in field_mapping.items():
                if frontend_field in data and data[frontend_field] is not None:
                    setattr(body_comp, backend_field, data[frontend_field])
                    updated_fields.append(backend_field)
            
            if updated_fields:
                body_comp.save()
                logger.info(f"Body composition data saved directly for user {user.email}. Updated fields: {updated_fields}")
            else:
                logger.info(f"No body composition data to update for user {user.email}")
            
        elif step == 'body_model':
            # Update body measurements for 3D model
            measurements, created = BodyMeasurements.objects.get_or_create(user=user)
            field_mapping = {
                'leftarm': 'left_arm',
                'rightarm': 'right_arm',
                'leftthigh': 'left_thigh',
                'rightthigh': 'right_thigh',
                'chest': 'chest',
                'neck': 'neck',
                'waist': 'waist',
                'shoulders': 'shoulders',
                'hips': 'hips',
                'calves': 'calves'
            }
            
            updated_fields = []
            for frontend_field, backend_field in field_mapping.items():
                if frontend_field in data and data[frontend_field] is not None:
                    setattr(measurements, backend_field, data[frontend_field])
                    updated_fields.append(backend_field)
            
            if updated_fields:
                measurements.save()
                logger.info(f"Body measurements saved directly for user {user.email}. Updated fields: {updated_fields}")
            else:
                logger.info(f"No body measurements to update for user {user.email}")
            
        elif step == 'specific_goals':
            # Update specific goal measurements
            goals, created = GoalMeasurements.objects.get_or_create(user=user)
            field_mapping = {
                'leftarm': 'left_arm',
                'rightarm': 'right_arm',
                'leftthigh': 'left_thigh',
                'rightthigh': 'right_thigh',
                'chest': 'chest',
                'neck': 'neck',
                'waist': 'waist',
                'shoulders': 'shoulders',
                'hips': 'hips',
                'calves': 'calves',
                'targetWeight': 'target_weight'
            }
            
            updated_fields = []
            for frontend_field, backend_field in field_mapping.items():
                if frontend_field in data and data[frontend_field] is not None:
                    setattr(goals, backend_field, data[frontend_field])
                    updated_fields.append(backend_field)
            
            if updated_fields:
                goals.save()
                logger.info(f"Goal measurements saved directly for user {user.email}. Updated fields: {updated_fields}")
            else:
                logger.info(f"No goal measurements to update for user {user.email}")
        
        logger.info(f"Step '{step}' processed successfully for user {user.email}")
        
    except Exception as e:
        logger.error(f"Error processing step '{step}' for user {user.email}: {str(e)}")
        return Response({
            'error': f'Error processing step: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'message': f'{step.replace("_", " ").title()} data processed successfully',
        'step': step,
        'status': 'completed'
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
                'bodyFat': 'decimal',
                'muscleMass': 'decimal',
                'boneMass': 'decimal',
                'waterWeight': 'decimal',
                'bmr': 'integer',
                'visceralFat': 'decimal',
                'proteinMass': 'decimal',
                'bmi': 'decimal',
                'muscleRate': 'decimal',
                'metabolicAge': 'integer',
                'weightWithoutFat': 'decimal',
                'composition_image': 'file'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    import logging
    logger = logging.getLogger(__name__)
    
    user = request.user
    logger.info(f"Updating body composition for user {user.email}")
    logger.info(f"Request data: {request.data}")
    
    composition, created = BodyComposition.objects.get_or_create(user=user)
    
    # Map frontend field names to backend field names
    field_mapping = {
        'bodyFat': 'body_fat',
        'muscleMass': 'muscle_mass',
        'boneMass': 'bone_mass',
        'waterWeight': 'water_weight',
        'visceralFat': 'visceral_fat',
        'proteinMass': 'protein_mass',
        'muscleRate': 'muscle_rate',
        'metabolicAge': 'metabolic_age',
        'weightWithoutFat': 'weight_without_fat',
        'bmi': 'bmi',
        'bmr': 'bmr'
    }
    
    updated_fields = []
    for frontend_field, backend_field in field_mapping.items():
        if frontend_field in request.data and request.data[frontend_field] is not None:
            setattr(composition, backend_field, request.data[frontend_field])
            updated_fields.append(backend_field)
    
    if updated_fields:
        composition.save()
        logger.info(f"Body composition saved for user {user.email}. Updated fields: {updated_fields}")
    else:
        logger.info(f"No body composition data to update for user {user.email}")
    
    return Response({
        'bodyComposition': BodyCompositionSerializer(composition).data,
        'message': 'Body composition updated successfully',
        'updated_fields': updated_fields
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
                'leftarm': 'decimal',
                'rightarm': 'decimal',
                'leftthigh': 'decimal',
                'rightthigh': 'decimal',
                'shoulders': 'decimal',
                'hips': 'decimal',
                'calves': 'decimal'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    import logging
    logger = logging.getLogger(__name__)
    
    user = request.user
    logger.info(f"Updating body measurements for user {user.email}")
    logger.info(f"Request data: {request.data}")
    
    measurements, created = BodyMeasurements.objects.get_or_create(user=user)
    
    # Map frontend field names to backend field names
    field_mapping = {
        'leftarm': 'left_arm',
        'rightarm': 'right_arm',
        'leftthigh': 'left_thigh',
        'rightthigh': 'right_thigh',
        'chest': 'chest',
        'neck': 'neck',
        'waist': 'waist',
        'shoulders': 'shoulders',
        'hips': 'hips',
        'calves': 'calves'
    }
    
    updated_fields = []
    for frontend_field, backend_field in field_mapping.items():
        if frontend_field in request.data and request.data[frontend_field] is not None:
            setattr(measurements, backend_field, request.data[frontend_field])
            updated_fields.append(backend_field)
    
    if updated_fields:
        measurements.save()
        logger.info(f"Body measurements saved for user {user.email}. Updated fields: {updated_fields}")
    else:
        logger.info(f"No body measurements to update for user {user.email}")
    
    return Response({
        'currentMeasurements': BodyMeasurementsSerializer(measurements).data,
        'message': 'Body measurements updated successfully',
        'updated_fields': updated_fields
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
                'leftarm': 'decimal',
                'rightarm': 'decimal',
                'leftthigh': 'decimal',
                'rightthigh': 'decimal',
                'shoulders': 'decimal',
                'hips': 'decimal',
                'calves': 'decimal',
                'targetWeight': 'decimal'
            }
        })
    
    # For POST requests, require authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    import logging
    logger = logging.getLogger(__name__)
    
    user = request.user
    logger.info(f"Updating goal measurements for user {user.email}")
    logger.info(f"Request data: {request.data}")
    
    goals, created = GoalMeasurements.objects.get_or_create(user=user)
    
    # Map frontend field names to backend field names
    field_mapping = {
        'leftarm': 'left_arm',
        'rightarm': 'right_arm',
        'leftthigh': 'left_thigh',
        'rightthigh': 'right_thigh',
        'chest': 'chest',
        'neck': 'neck',
        'waist': 'waist',
        'shoulders': 'shoulders',
        'hips': 'hips',
        'calves': 'calves',
        'targetWeight': 'target_weight'
    }
    
    updated_fields = []
    for frontend_field, backend_field in field_mapping.items():
        if frontend_field in request.data and request.data[frontend_field] is not None:
            setattr(goals, backend_field, request.data[frontend_field])
            updated_fields.append(backend_field)
    
    if updated_fields:
        goals.save()
        logger.info(f"Goal measurements saved for user {user.email}. Updated fields: {updated_fields}")
    else:
        logger.info(f"No goal measurements to update for user {user.email}")
    
    return Response({
        'goalMeasurements': GoalMeasurementsSerializer(goals).data,
        'message': 'Goal measurements updated successfully',
        'updated_fields': updated_fields
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



@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_user_data(request):
    """Public endpoint to view user data without authentication"""
    from users.models import User, BodyComposition, BodyMeasurements, GoalMeasurements
    
    # Get all users and their data
    users_data = []
    for user in User.objects.all():
        user_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'gender': user.gender,
            'height': user.height,
            'weight': user.weight,
            'age': user.age,
            'fitness_level': user.fitness_level,
            'fitness_goal': user.fitness_goal,
            'specific_goal': user.specific_goal,
            'has_completed_onboarding': user.has_completed_onboarding,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
        }
        
        # Get body composition data
        try:
            body_comp = BodyComposition.objects.get(user=user)
            user_data['body_composition'] = {
                'body_fat': body_comp.body_fat,
                'muscle_mass': body_comp.muscle_mass,
                'bone_mass': body_comp.bone_mass,
                'water_weight': body_comp.water_weight,
                'bmr': body_comp.bmr,
                'visceral_fat': body_comp.visceral_fat,
                'protein_mass': body_comp.protein_mass,
                'bmi': body_comp.bmi,
                'muscle_rate': body_comp.muscle_rate,
                'metabolic_age': body_comp.metabolic_age,
                'weight_without_fat': body_comp.weight_without_fat,
            }
        except BodyComposition.DoesNotExist:
            user_data['body_composition'] = None
        
        # Get body measurements data
        try:
            measurements = BodyMeasurements.objects.get(user=user)
            user_data['body_measurements'] = {
                'chest': measurements.chest,
                'neck': measurements.neck,
                'waist': measurements.waist,
                'left_arm': measurements.left_arm,
                'right_arm': measurements.right_arm,
                'left_thigh': measurements.left_thigh,
                'right_thigh': measurements.right_thigh,
                'shoulders': measurements.shoulders,
                'hips': measurements.hips,
                'calves': measurements.calves,
            }
        except BodyMeasurements.DoesNotExist:
            user_data['body_measurements'] = None
        
        # Get goal measurements data
        try:
            goals = GoalMeasurements.objects.get(user=user)
            user_data['goal_measurements'] = {
                'chest': goals.chest,
                'neck': goals.neck,
                'waist': goals.waist,
                'left_arm': goals.left_arm,
                'right_arm': goals.right_arm,
                'left_thigh': goals.left_thigh,
                'right_thigh': goals.right_thigh,
                'shoulders': goals.shoulders,
                'hips': goals.hips,
                'calves': goals.calves,
                'target_weight': goals.target_weight,
            }
        except GoalMeasurements.DoesNotExist:
            user_data['goal_measurements'] = None
        
        users_data.append(user_data)
    
    return Response({
        'message': 'User data from database',
        'total_users': len(users_data),
        'users': users_data
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint to verify API connectivity"""
    return Response({
        'message': 'API is running',
        'status': 'healthy',
        'timestamp': str(datetime.now()),
    })

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def google_login(request):
    """Handle Google OAuth login"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Google login request received: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request data: {request.data}")
    
    if request.method == 'GET':
        logger.info("Google login GET request - returning debug info")
        return Response({
            'message': 'Google Login endpoint - GET method for debugging',
            'method': 'GET',
            'endpoint': 'Google Login',
            'expected_data': {
                'id_token': 'string (Google ID token)'
            }
        })
    
    try:
        logger.info("Processing Google login POST request")
        id_token_data = request.data.get('id_token')
        logger.info(f"ID token received: {id_token_data[:50] if id_token_data else 'None'}...")
        
        if not id_token_data:
            logger.error("No ID token provided")
            return Response({
                'error': 'ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the Google ID token
        logger.info("Verifying Google ID token...")
        idinfo = id_token.verify_oauth2_token(
            id_token_data, 
            requests.Request(), 
            '876432031351-h5hmbv4qj96aci5ngcrfqa4kdvef24s2.apps.googleusercontent.com'
        )
        logger.info(f"Token verified successfully. User info: {idinfo}")
        
        # Extract user information
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        logger.info(f"Extracted user info - Email: {email}, Name: {name}")
        
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
        
        logger.info(f"User {'created' if created else 'found'}: {user.email}")
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        logger.info("Tokens generated successfully")
        
        # Get user data with serializer
        user_data = UserSerializer(user).data
        logger.info(f"User data being sent to frontend: {user_data}")
        logger.info(f"hasCompletedOnboarding value: {user_data.get('hasCompletedOnboarding')}")
        
        response_data = {
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Google login successful',
            'is_new_user': created
        }
        
        logger.info(f"Google login successful for user: {user.email}")
        logger.info(f"Full response data: {response_data}")
        return Response(response_data)
        
    except ValueError as e:
        logger.error(f"Invalid ID token error: {str(e)}")
        return Response({
            'error': 'Invalid ID token'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Google login failed with exception: {str(e)}")
        return Response({
            'error': f'Google login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


