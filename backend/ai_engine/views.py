from django.shortcuts import render
from rest_framework import generics, permissions
from .models import AIRequest, AIRecommendation, AITrainingData, AIModelVersion
from .serializers import AIRequestSerializer, AIRecommendationSerializer, AITrainingDataSerializer, AIModelVersionSerializer

# Create your views here.

# --- AIRequest CRUD ---
class AIRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = AIRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AIRequestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AIRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIRequest.objects.filter(user=self.request.user)

# --- AIRecommendation CRUD ---
class AIRecommendationListCreateView(generics.ListCreateAPIView):
    serializer_class = AIRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIRecommendation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AIRecommendationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AIRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIRecommendation.objects.filter(user=self.request.user)

# --- AITrainingData CRUD ---
class AITrainingDataListCreateView(generics.ListCreateAPIView):
    serializer_class = AITrainingDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AITrainingData.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AITrainingDataRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AITrainingDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AITrainingData.objects.filter(user=self.request.user)

# --- AIModelVersion CRUD ---
class AIModelVersionListCreateView(generics.ListCreateAPIView):
    queryset = AIModelVersion.objects.all()
    serializer_class = AIModelVersionSerializer
    permission_classes = [permissions.IsAdminUser]

class AIModelVersionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AIModelVersion.objects.all()
    serializer_class = AIModelVersionSerializer
    permission_classes = [permissions.IsAdminUser]
