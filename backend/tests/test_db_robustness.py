import unittest
from unittest.mock import MagicMock, patch

from dataforge import db

class TestDBRobustness(unittest.TestCase):
    def test_db_insert_empty_data(self):
        mock_res = MagicMock()
        mock_res.data = []  # Empty list returned (e.g. RLS policy blocked insert)
        
        mock_table = MagicMock()
        mock_table.insert.return_value.execute.return_value = mock_res
        
        mock_client = MagicMock()
        mock_client.table.return_value = mock_table
        
        with patch.object(db, 'db_client', mock_client):
            result = db.db_insert("uploads", {"filename": "test.csv"})
            self.assertEqual(result, {})

    def test_db_update_empty_data(self):
        mock_res = MagicMock()
        mock_res.data = []  # Empty list returned (e.g. no record matched ID on update)
        
        mock_table = MagicMock()
        mock_table.update.return_value.eq.return_value.execute.return_value = mock_res
        
        mock_client = MagicMock()
        mock_client.table.return_value = mock_table
        
        with patch.object(db, 'db_client', mock_client):
            result = db.db_update("uploads", 999, {"filename": "new.csv"})
            self.assertEqual(result, {})

if __name__ == '__main__':
    unittest.main()
