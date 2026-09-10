from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for /api/v1/categories/"""
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Every user only ever sees their own rows
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    """CRUD for /api/v1/transactions/"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related("category")

        params = self.request.query_params
        if txn_type := params.get("type"):
            qs = qs.filter(txn_type=txn_type)
        if category := params.get("category"):
            qs = qs.filter(category_id=category)
        if start := params.get("start_date"):
            qs = qs.filter(date__gte=start)
        if end := params.get("end_date"):
            qs = qs.filter(date__lte=end)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """
        GET /api/v1/transactions/summary/
        Totals + per-category breakdown. Respects the same filters as list.
        """
        qs = self.get_queryset()

        income = qs.filter(txn_type=Transaction.INCOME).aggregate(
            total=Sum("amount"))["total"] or 0
        expense = qs.filter(txn_type=Transaction.EXPENSE).aggregate(
            total=Sum("amount"))["total"] or 0

        by_category = (
            qs.filter(txn_type=Transaction.EXPENSE)
            .values("category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        return Response({
            "total_income": income,
            "total_expense": expense,
            "balance": income - expense,
            "transaction_count": qs.count(),
            "expense_by_category": [
                {"category": r["category__name"] or "Uncategorized", "total": r["total"]}
                for r in by_category
            ],
        })

    @action(detail=False, methods=["get"])
    def monthly(self, request):
        """
        GET /api/v1/transactions/monthly/
        Income and expense totalled per month, oldest first.
        Optional ?months=6 to limit how far back to go.
        """
        qs = self.get_queryset()

        rows = (
            qs.annotate(month=TruncMonth("date"))
            .values("month", "txn_type")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        # Collapse the two rows per month (income + expense) into one object
        buckets = {}
        for r in rows:
            key = r["month"].strftime("%Y-%m")
            buckets.setdefault(key, {"month": key, "income": 0, "expense": 0})
            buckets[key][r["txn_type"]] = r["total"]

        data = sorted(buckets.values(), key=lambda x: x["month"])

        try:
            limit = int(request.query_params.get("months", 12))
            data = data[-limit:]
        except ValueError:
            pass

        return Response(data)
