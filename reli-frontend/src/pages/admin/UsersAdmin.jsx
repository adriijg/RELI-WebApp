import { useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import EntityFormModal from '../../components/admin/EntityFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Badge from '../../components/admin/Badge';
import { useCrud } from '../../hooks/useCrud';
import { deleteUser, getUsers, updateUser } from '../../services/api';
import { useApp } from '../../context/AppContext';

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  {
    name: 'password',
    label: 'Nueva contraseña',
    type: 'password',
    fullWidth: true,
    placeholder: 'Déjalo vacío para no cambiarla (mín. 8 si la cambias)',
  },
  {
    name: 'canVote',
    label: 'Puede votar en el quinteto',
    type: 'checkbox',
    fullWidth: true,
    checkboxLabel: 'Tiene permiso para votar',
  },
];

export default function UsersAdmin() {
  const { user: currentUser } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const crud = useCrud({
    fetchPage: getUsers,
    updateItem: updateUser,
    deleteItem: deleteUser,
    sortBy: 'username',
    direction: 'asc',
    serverSearch: true,
  });

  const isSelf = (row) => row?.id === currentUser?.id;

  const requestDelete = (row) => {
    if (isSelf(row)) {
      setActionError('No puedes borrar tu propia cuenta.');
      return;
    }
    setActionError('');
    setDeleteTarget(row);
  };

  const requestBulkDelete = (selected) => {
    const targets = selected.filter((row) => !isSelf(row));
    if (targets.length < selected.length) {
      setActionError('Se ha excluido tu propia cuenta de la selección.');
    } else {
      setActionError('');
    }
    if (targets.length > 0) setBulkTarget(targets);
  };

  const confirmDelete = async () => {
    if (bulkTarget) {
      await crud.bulkRemove(bulkTarget.map((row) => row.id));
      setBulkTarget(null);
    } else {
      await crud.remove(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'username',
      label: 'Usuario',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-re-rojo/15 text-re-rojo font-black text-xs flex items-center justify-center shrink-0">
            {String(value).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-black truncate">{value}</p>
            {isSelf(row) && (
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
      render: (value) =>
        value === 'ROLE_ADMIN' ? <Badge variant="red">Admin</Badge> : <Badge>Usuario</Badge>,
    },
    {
      key: 'canVote',
      label: 'Voto',
      render: (value) =>
        value ? <Badge variant="green">Puede votar</Badge> : <Badge variant="red">Sin permiso</Badge>,
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
            onClick={crud.reload}
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
        rows={crud.rows}
        loading={crud.loading}
        error={crud.error}
        page={crud.page}
        totalPages={crud.totalPages}
        totalElements={crud.totalElements}
        onPageChange={crud.load}
        serverSearch
        searchValue={crud.search}
        onSearchChange={crud.setSearch}
        onEdit={(row) => {
          setEditing({ ...row, password: '' });
          setModalOpen(true);
        }}
        onDelete={requestDelete}
        onBulkDelete={requestBulkDelete}
        emptyMessage="No hay usuarios registrados."
      />

      <EntityFormModal
        open={modalOpen}
        title="Editar usuario"
        fields={FIELDS}
        initialValue={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            username: values.username,
            email: values.email,
            canVote: Boolean(values.canVote),
          };
          if (values.password && values.password.trim() !== '') payload.password = values.password;
          await crud.save(payload, editing.id);
          setModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget || bulkTarget)}
        title={bulkTarget ? '¿Borrar usuarios seleccionados?' : '¿Borrar usuario?'}
        message={
          bulkTarget
            ? `Se eliminarán ${bulkTarget.length} cuentas de forma permanente.`
            : `Se eliminará la cuenta de "${deleteTarget?.username}" de forma permanente.`
        }
        onClose={() => {
          setDeleteTarget(null);
          setBulkTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
