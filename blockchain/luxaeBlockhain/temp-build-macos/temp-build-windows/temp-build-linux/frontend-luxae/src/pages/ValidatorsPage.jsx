import { useEffect } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import { 
  UsersIcon, 
  ShieldCheckIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const ValidatorsPage = () => {
  const {
    validators,
    loading,
    error,
    fetchValidators,
  } = useBlockchain();

  useEffect(() => {
    fetchValidators();
  }, [fetchValidators]);

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
  };

  const formatStake = (stake) => {
    if (!stake) return '0 LXA';
    return `${parseFloat(stake).toFixed(2)} LXA`;
  };

  const getValidatorStatus = (validator) => {
    if (validator.active) {
      return { status: 'Activo', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (validator.stake > 0) {
      return { status: 'Staking', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'Inactivo', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
  };

  if (loading && !validators) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-luxae-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Validadores</h1>
          <p className="mt-2 text-gray-600">
            Monitorea los validadores de la red blockchain Luxae
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validators Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-luxae-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Validadores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validators?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validators?.filter(v => v.active)?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staking</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validators?.filter(v => v.stake > 0)?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validators?.filter(v => !v.active && v.stake === 0)?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validators Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Validadores</h2>
            <div className="text-sm text-gray-500">
              Mostrando {validators?.length || 0} validadores
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stake
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bloques Validados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comisión
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validators?.map((validator, index) => {
                  const statusInfo = getValidatorStatus(validator);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatHash(validator.address)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatStake(validator.stake)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {validator.blocksValidated || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {validator.lastActivity ? new Date(validator.lastActivity).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {validator.commission ? `${validator.commission}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!validators || validators.length === 0) && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay validadores</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los validadores aparecerán aquí cuando se unan a la red.
              </p>
            </div>
          )}
        </div>

        {/* Validator Requirements */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requisitos para Validadores</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <ShieldCheckIcon className="h-4 w-4 text-green-600 mr-2" />
                Stake mínimo: 1,000 LXA
              </li>
              <li className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-600 mr-2" />
                Disponibilidad 24/7
              </li>
              <li className="flex items-center">
                <UsersIcon className="h-4 w-4 text-blue-600 mr-2" />
                Conexión estable a la red
              </li>
              <li className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-2" />
                Sin comportamiento malicioso
              </li>
            </ul>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recompensas</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-2" />
                Recompensa por bloque: 100 LXA
              </li>
              <li className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-600 mr-2" />
                Comisión por transacciones
              </li>
              <li className="flex items-center">
                <ShieldCheckIcon className="h-4 w-4 text-blue-600 mr-2" />
                Participación en gobernanza
              </li>
              <li className="flex items-center">
                <UsersIcon className="h-4 w-4 text-purple-600 mr-2" />
                Reputación en la red
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatorsPage; 