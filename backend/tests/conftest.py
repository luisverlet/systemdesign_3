import pytest

from app.services.disruption import mocks


@pytest.fixture(autouse=True)
def _reset_mocks():
    mocks.reset()
    yield
    mocks.reset()
