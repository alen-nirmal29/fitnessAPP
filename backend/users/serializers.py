from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, BodyComposition, BodyMeasurements, GoalMeasurements

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitness_goal', 'specific_goal', 'has_completed_onboarding',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates during onboarding"""
    class Meta:
        model = User
        fields = [
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitness_goal', 'specific_goal'
        ]

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'confirm_password']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs

class BodyCompositionSerializer(serializers.ModelSerializer):
    """Serializer for BodyComposition model"""
    class Meta:
        model = BodyComposition
        fields = [
            'id', 'body_fat', 'muscle_mass', 'bone_mass', 'water_weight',
            'bmr', 'visceral_fat', 'protein_mass', 'bmi', 'muscle_rate',
            'metabolic_age', 'weight_without_fat', 'composition_image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BodyMeasurementsSerializer(serializers.ModelSerializer):
    """Serializer for BodyMeasurements model"""
    class Meta:
        model = BodyMeasurements
        fields = [
            'id', 'chest', 'neck', 'waist', 'left_arm', 'right_arm',
            'left_thigh', 'right_thigh', 'shoulders', 'hips', 'calves',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class GoalMeasurementsSerializer(serializers.ModelSerializer):
    """Serializer for GoalMeasurements model"""
    class Meta:
        model = GoalMeasurements
        fields = [
            'id', 'chest', 'neck', 'waist', 'left_arm', 'right_arm',
            'left_thigh', 'right_thigh', 'shoulders', 'hips', 'calves',
            'target_weight', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserCompleteProfileSerializer(serializers.ModelSerializer):
    """Complete user profile with related data"""
    body_composition = BodyCompositionSerializer(read_only=True)
    current_measurements = BodyMeasurementsSerializer(read_only=True)
    goal_measurements = GoalMeasurementsSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitness_goal', 'specific_goal', 'has_completed_onboarding',
            'body_composition', 'current_measurements', 'goal_measurements',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OnboardingStepSerializer(serializers.Serializer):
    """Serializer for onboarding step updates"""
    step = serializers.CharField()
    data = serializers.JSONField()
    
    def validate_step(self, value):
        valid_steps = ['profile', 'goals', 'body_composition', 'body_model', 'specific_goals']
        if value not in valid_steps:
            raise serializers.ValidationError(f"Invalid step. Must be one of: {valid_steps}")
        return value 