from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_onboarding_step(request):
    """Update user onboarding progress"""
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_body_composition(request):
    """Update user body composition"""
    user = request.user
    composition, created = BodyComposition.objects.get_or_create(user=user)
    
    serializer = BodyCompositionSerializer(composition, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    composition = serializer.save()
    
    return Response({
        'body_composition': BodyCompositionSerializer(composition).data,
        'message': 'Body composition updated successfully'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_body_measurements(request):
    """Update user body measurements"""
    user = request.user
    measurements, created = BodyMeasurements.objects.get_or_create(user=user)
    
    serializer = BodyMeasurementsSerializer(measurements, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    measurements = serializer.save()
    
    return Response({
        'measurements': BodyMeasurementsSerializer(measurements).data,
        'message': 'Body measurements updated successfully'
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_goal_measurements(request):
    """Update user goal measurements"""
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_onboarding(request):
    """Mark onboarding as complete"""
    user = request.user
    user.has_completed_onboarding = True
    user.save()
    
    return Response({
        'message': 'Onboarding completed successfully',
        'user': UserSerializer(user).data
    })
