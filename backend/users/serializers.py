from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, BodyComposition, BodyMeasurements, GoalMeasurements

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with frontend field mapping"""
    # Frontend field names (camelCase)
    fitnessGoal = serializers.CharField(source='fitness_goal', required=False)
    specificGoal = serializers.CharField(source='specific_goal', required=False)
    hasCompletedOnboarding = serializers.BooleanField(source='has_completed_onboarding')
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitnessGoal', 'specificGoal', 'hasCompletedOnboarding',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates during onboarding with frontend field mapping"""
    # Frontend field names (camelCase)
    fitnessGoal = serializers.CharField(source='fitness_goal', required=False)
    specificGoal = serializers.CharField(source='specific_goal', required=False)
    
    class Meta:
        model = User
        fields = [
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitnessGoal', 'specificGoal'
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
    """Serializer for BodyComposition model with frontend field mapping"""
    # Frontend field names (camelCase)
    bodyFat = serializers.DecimalField(source='body_fat', max_digits=4, decimal_places=1, required=False)
    muscleMass = serializers.DecimalField(source='muscle_mass', max_digits=5, decimal_places=2, required=False)
    boneMass = serializers.DecimalField(source='bone_mass', max_digits=4, decimal_places=2, required=False)
    waterWeight = serializers.DecimalField(source='water_weight', max_digits=4, decimal_places=1, required=False)
    visceralFat = serializers.DecimalField(source='visceral_fat', max_digits=3, decimal_places=1, required=False)
    proteinMass = serializers.DecimalField(source='protein_mass', max_digits=4, decimal_places=2, required=False)
    muscleRate = serializers.DecimalField(source='muscle_rate', max_digits=4, decimal_places=1, required=False)
    metabolicAge = serializers.IntegerField(source='metabolic_age', required=False)
    weightWithoutFat = serializers.DecimalField(source='weight_without_fat', max_digits=5, decimal_places=2, required=False)
    
    class Meta:
        model = BodyComposition
        fields = [
            'id', 'bodyFat', 'muscleMass', 'boneMass', 'waterWeight',
            'bmr', 'visceralFat', 'proteinMass', 'bmi', 'muscleRate',
            'metabolicAge', 'weightWithoutFat', 'composition_image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BodyMeasurementsSerializer(serializers.ModelSerializer):
    """Serializer for BodyMeasurements model with frontend field mapping"""
    # Frontend field names (matching actual usage)
    leftarm = serializers.DecimalField(source='left_arm', max_digits=4, decimal_places=1, required=False)
    rightarm = serializers.DecimalField(source='right_arm', max_digits=4, decimal_places=1, required=False)
    leftthigh = serializers.DecimalField(source='left_thigh', max_digits=4, decimal_places=1, required=False)
    rightthigh = serializers.DecimalField(source='right_thigh', max_digits=4, decimal_places=1, required=False)
    
    class Meta:
        model = BodyMeasurements
        fields = [
            'id', 'chest', 'neck', 'waist', 'leftarm', 'rightarm',
            'leftthigh', 'rightthigh', 'shoulders', 'hips', 'calves',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class GoalMeasurementsSerializer(serializers.ModelSerializer):
    """Serializer for GoalMeasurements model with frontend field mapping"""
    # Frontend field names (matching actual usage)
    leftarm = serializers.DecimalField(source='left_arm', max_digits=4, decimal_places=1, required=False)
    rightarm = serializers.DecimalField(source='right_arm', max_digits=4, decimal_places=1, required=False)
    leftthigh = serializers.DecimalField(source='left_thigh', max_digits=4, decimal_places=1, required=False)
    rightthigh = serializers.DecimalField(source='right_thigh', max_digits=4, decimal_places=1, required=False)
    targetWeight = serializers.DecimalField(source='target_weight', max_digits=5, decimal_places=2, required=False)
    
    class Meta:
        model = GoalMeasurements
        fields = [
            'id', 'chest', 'neck', 'waist', 'leftarm', 'rightarm',
            'leftthigh', 'rightthigh', 'shoulders', 'hips', 'calves',
            'targetWeight', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserCompleteProfileSerializer(serializers.ModelSerializer):
    """Complete user profile with related data and frontend field mapping"""
    # Frontend field names (camelCase)
    fitnessGoal = serializers.CharField(source='fitness_goal', required=False)
    specificGoal = serializers.CharField(source='specific_goal', required=False)
    hasCompletedOnboarding = serializers.BooleanField(source='has_completed_onboarding')
    bodyComposition = BodyCompositionSerializer(source='body_composition', read_only=True)
    currentMeasurements = BodyMeasurementsSerializer(source='current_measurements', read_only=True)
    goalMeasurements = GoalMeasurementsSerializer(source='goal_measurements', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'height', 'weight', 'gender', 'age', 'fitness_level',
            'fitnessGoal', 'specificGoal', 'hasCompletedOnboarding',
            'bodyComposition', 'currentMeasurements', 'goalMeasurements',
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