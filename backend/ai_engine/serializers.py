from rest_framework import serializers
from .models import AIRequest, AIRecommendation, AITrainingData, AIModelVersion

class AIRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class AIRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

class AITrainingDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AITrainingData
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']

class AIModelVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModelVersion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at'] 