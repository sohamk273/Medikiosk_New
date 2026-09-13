"""Test verifying Alembic migration execution."""
import os
import tempfile
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, inspect


def test_alembic_migration_execution():
    """Verifies Alembic migrations execute cleanly and create all 7 foundational tables."""
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db_path = os.path.join(tmpdir, "test_migration.db")
        sync_sqlite_url = f"sqlite:///{test_db_path}"

        # Configure Alembic
        alembic_ini_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
        )
        cfg = Config(alembic_ini_path)
        cfg.set_main_option("sqlalchemy.url", sync_sqlite_url)

        # Run migration upgrade
        command.upgrade(cfg, "head")

        # Inspect created tables in database
        engine = create_engine(sync_sqlite_url)
        try:
            inspector = inspect(engine)
            tables = set(inspector.get_table_names())

            expected_tables = {
                "alembic_version",
                "users",
                "patients",
                "patient_identities",
                "encounters",
                "queue_entries",
                "consent_records",
                "hospital_settings",
            }

            assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"

            # Test downgrade
            command.downgrade(cfg, "base")
            inspector = inspect(engine)
            remaining_tables = set(inspector.get_table_names())
            assert remaining_tables == {"alembic_version"}
        finally:
            engine.dispose()
