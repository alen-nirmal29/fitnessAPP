from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    """Custom User model for FitTransform app"""
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    FITNESS_GOAL_CHOICES = [
        ('lose_weight', 'Lose Weight'),
        ('maintain', 'Maintain Physique'),
        ('gain_weight', 'Gain Weight'),
    ]
    
    SPECIFIC_GOAL_CHOICES = [
        ('increase_strength', 'Increase Strength'),
        ('build_muscle', 'Build Muscle'),
        ('weight_loss', 'Weight Loss'),
        ('weight_gain', 'Weight Gain'),
        ('personal_training', 'Personal Training'),
    ]
    
    # Basic profile fields
    email = models.EmailField(unique=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in cm
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in kg
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    fitness_level = models.CharField(max_length=20, default='beginner')  # beginner, intermediate, advanced
    
    # Goals
    fitness_goal = models.CharField(max_length=20, choices=FITNESS_GOAL_CHOICES, null=True, blank=True)
    specific_goal = models.CharField(max_length=20, choices=SPECIFIC_GOAL_CHOICES, null=True, blank=True)
    
    # Onboarding status
    has_completed_onboarding = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    class Meta:
        db_table = 'users'

class BodyComposition(models.Model):
    """Body composition measurements for users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='body_composition')
    
    # Body composition metrics
    body_fat = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # percentage
    muscle_mass = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    bone_mass = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)  # kg
    water_weight = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # percentage
    bmr = models.PositiveIntegerField(null=True, blank=True)  # Basal Metabolic Rate in kcal
    visceral_fat = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)  # percentage
    protein_mass = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)  # kg
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    muscle_rate = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # percentage
    metabolic_age = models.PositiveIntegerField(null=True, blank=True)
    weight_without_fat = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    
    # Image upload
    composition_image = models.ImageField(upload_to='body_compositions/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - Body Composition"
    
    class Meta:
        db_table = 'body_compositions'

class BodyMeasurements(models.Model):
    """Body measurements for 3D model and progress tracking"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='current_measurements')
    
    # Basic measurements (in cm)
    chest = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    neck = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    waist = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    left_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    left_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Additional measurements
    shoulders = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hips = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    calves = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - Measurements"
    
    class Meta:
        db_table = 'body_measurements'

class GoalMeasurements(models.Model):
    """Target measurements for user goals"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='goal_measurements')
    
    # Target measurements (in cm)
    chest = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    neck = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    waist = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    left_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_arm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    left_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    right_thigh = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Additional target measurements
    shoulders = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hips = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    calves = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Target weight
    target_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - Goal Measurements"
    
    class Meta:
        db_table = 'goal_measurements'
