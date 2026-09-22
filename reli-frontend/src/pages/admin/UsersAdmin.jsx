import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { deleteUser, getUsers, updateUser } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function UsersAdmin() {
  const { user: currentUser } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fields = [
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'password',
      label: 'Nueva contraseña',
      type: 'password',
      fullWidth: true,
      placeholder: 'Déjalo vacío para no cambiarla (mín. 8 si la cambias)',
    },
  ];

  const columns = [
    {
      key: 'username',
      label: 'Usuario',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-re-rojo/15 text-re-rojo font-black text-xs flex items-center justify-center shrink-0">
            {String(v).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-black truncate">{v}</p>
            {row.id === currentUser?.id && (
              <span className="text-[9px] font-black uppercase tracking-widest text-re-dorado">Tú</span>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Rol',
      render: (v) => (
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            v === 'ROLE_ADMIN' ? 'bg-re-rojo/15 text-re-rojo' : 'bg-muted/20 text-muted-foreground'
          }`}
        >
          {v === 'ROLE_ADMIN' ? 'Admin' : 'Usuario'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Alta' },
  ];

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas registradas en la plataforma. El rol de admin se asigna por configuración del servidor."
        action={
          <button
            onClick={load}
            className="border border-card-border font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-muted/10 transition-all"
          >
            Actualizar
          </button>
        }
      />

      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-500 text-xs font-bold p-3 rounded-xl text-center">
          {actionError}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={0}
        totalPages={1}
        totalElements={rows.length}
        onPageChange={() => {}}
        onEdit={(row) => {
          setEditing({ ...row, password: '' });
          setModalOpen(true);
        }}
        onDelete={(row) => {
          setActionError('');
          setDeleteTarget(row);
        }}
        searchKeys={['username', 'email', 'role']}
        emptyMessage="No hay usuarios registrados."
      />

      <EntityFormModal
        open={modalOpen}
        title="Editar usuario"
        fields={fields}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          setActionError('');
          const payload = {
            username: values.username,
            email: values.email,
          };
          if (values.password && values.password.trim() !== '') {
            payload.password = values.password;
          }
          try {
            await updateUser(editing.id, payload);
            setModalOpen(false);
            await load();
          } catch (err) {
            setActionError(err.message);
            throw err;
          }
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="¿Borrar usuario?"
        message={`Se eliminará la cuenta de "${deleteTarget?.username}" de forma permanente.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setActionError('');
          try {
            await deleteUser(deleteTarget.id);
            setDeleteTarget(null);
            await load();
          } catch (err) {
            setActionError(err.message);
            throw err;
          }
        }}
      />
    </div>
  );
}
