import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Edit, Block, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface MedicationRecord {
  id: number;
  user_id: number;
  date: string;
  morning_taken: boolean;
  afternoon_taken: boolean;
  evening_taken: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, recordsResponse] = await Promise.all([
        axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/medication-records`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(usersResponse.data);
      setRecords(recordsResponse.data);
      setLoading(false);
    } catch (error) {
      setError('データの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const updateUser = async (userId: number, updates: { is_admin?: boolean; is_active?: boolean }) => {
    try {
      setError('');
      setSuccess('');

      const response = await axios.put(`${API_URL}/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(prev => prev.map(user => 
        user.id === userId ? response.data : user
      ));

      setSuccess('ユーザー情報を更新しました');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('更新に失敗しました');
    }
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleUserUpdate = async () => {
    if (!editingUser) return;

    await updateUser(editingUser.id, {
      is_admin: editingUser.is_admin,
      is_active: editingUser.is_active
    });

    handleDialogClose();
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            管理画面
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Typography variant="h4" gutterBottom>
          ユーザー管理
        </Typography>
        
        <Paper sx={{ mb: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>管理者</TableCell>
                  <TableCell>アクティブ</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_admin}
                        onChange={(e) => updateUser(user.id, { is_admin: e.target.checked })}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_active}
                        onChange={(e) => updateUser(user.id, { is_active: e.target.checked })}
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUserEdit(user)}
                        startIcon={<Edit />}
                      >
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Typography variant="h4" gutterBottom>
          薬の記録データ
        </Typography>
        
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ユーザーID</TableCell>
                  <TableCell>日付</TableCell>
                  <TableCell>朝</TableCell>
                  <TableCell>昼</TableCell>
                  <TableCell>夜</TableCell>
                  <TableCell>備考</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>更新日</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.slice(-20).reverse().map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.user_id}</TableCell>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>{record.morning_taken ? '✓' : '✗'}</TableCell>
                    <TableCell>{record.afternoon_taken ? '✓' : '✗'}</TableCell>
                    <TableCell>{record.evening_taken ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      {record.notes ? (
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {record.notes}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {record.updated_at ? new Date(record.updated_at).toLocaleDateString('ja-JP') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminPanel;
