"""Payment abstraction layer.

No real gateway is wired up. The app uses the MockPaymentGateway so checkout can
be demonstrated safely. To integrate a real gateway (Stripe/Razorpay/PayPal) later,
implement the same interface in a new class and swap ``get_gateway()`` to return it.
"""

import uuid


class PaymentGatewayError(Exception):
    pass


class MockPaymentGateway:
    """Mock gateway that always succeeds. Never charges real money."""

    name = 'mock'

    def create_payment(self, order, amount, description='DhartiX order'):
        return {
            'success': True,
            'gateway': self.name,
            'payment_reference': f'mock-{uuid.uuid4().hex[:12]}',
            'amount': str(amount),
            'status': 'AUTHORIZED',
            'message': 'Payment authorized (mock gateway - no real charge).',
        }

    def verify_payment(self, payment_reference):
        return {'success': True, 'status': 'AUTHORIZED', 'payment_reference': payment_reference}


def get_gateway():
    """Return the active payment gateway. Swap the class here to go live."""
    return MockPaymentGateway()