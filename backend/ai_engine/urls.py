from django.urls import path
from . import views

app_name = 'ai_engine'

urlpatterns = [
    # AI Requests
    path('requests/', views.AIRequestListCreateView.as_view(), name='airequest-list-create'),
    path('requests/<int:pk>/', views.AIRequestRetrieveUpdateDestroyView.as_view(), name='airequest-detail'),

    # AI Recommendations
    path('recommendations/', views.AIRecommendationListCreateView.as_view(), name='airecommendation-list-create'),
    path('recommendations/<int:pk>/', views.AIRecommendationRetrieveUpdateDestroyView.as_view(), name='airecommendation-detail'),

    # AI Training Data
    path('training/', views.AITrainingDataListCreateView.as_view(), name='aitrainingdata-list-create'),
    path('training/<int:pk>/', views.AITrainingDataRetrieveUpdateDestroyView.as_view(), name='aitrainingdata-detail'),

    # AI Model Versions
    path('models/', views.AIModelVersionListCreateView.as_view(), name='aimodelversion-list-create'),
    path('models/<int:pk>/', views.AIModelVersionRetrieveUpdateDestroyView.as_view(), name='aimodelversion-detail'),
] 