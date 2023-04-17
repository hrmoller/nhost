import { RetryableErrorBoundary } from '@/components/common/RetryableErrorBoundary';
import {
  useGetAppFunctionsMetadataQuery,
  useGetProjectMetricsQuery,
  useGetRemoteAppMetricsQuery,
} from '@/generated/graphql';
import useIsPlatform from '@/hooks/common/useIsPlatform';
import { useRemoteApplicationGQLClient } from '@/hooks/useRemoteApplicationGQLClient';
import { useCurrentWorkspaceAndProject } from '@/hooks/v2/useCurrentWorkspaceAndProject';
import LinearProgress from '@/ui/v2/LinearProgress';
import Text from '@/ui/v2/Text';
import { prettifySize } from '@/utils/common/prettifySize';

const now = new Date();

export interface UsageProgressProps {
  /**
   * The title of the current service being rendered.
   */
  label: string;
  /**
   * The amount used for a given servince on the current project.
   */
  used?: string | number;
  /**
   * The total amount of a given service.
   */
  total?: string | number;
  /**
   * The percentage of the service used.
   */
  percentage?: number;
}

export function UsageProgress({
  label,
  used,
  total,
  percentage,
}: UsageProgressProps) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-row place-content-between items-center">
        <Text variant="subtitle2" className="lg:!font-medium">
          {label}
        </Text>

        <Text className="text-xs !font-medium">
          {used} {total && <span className="opacity-80">of {total}</span>}
        </Text>
      </div>

      <LinearProgress
        variant="determinate"
        value={percentage === 0 ? -1 : percentage}
      />
    </div>
  );
}

export function OverviewUsageMetrics() {
  const isPlatform = useIsPlatform();
  const { currentProject } = useCurrentWorkspaceAndProject();
  const remoteAppClient = useRemoteApplicationGQLClient();

  const { data: functionsInfoData, loading: functionMetricsLoading } =
    useGetAppFunctionsMetadataQuery({
      variables: { id: currentProject?.id },
      skip: !isPlatform || !currentProject,
    });

  const { data: projectMetrics, loading: projectMetricsLoading } =
    useGetProjectMetricsQuery({
      variables: {
        appId: currentProject?.id,
        subdomain: currentProject?.subdomain,
        from: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      skip: !isPlatform || !currentProject,
    });

  const { data: remoteAppMetricsData, loading: remoteAppMetricsLoading } =
    useGetRemoteAppMetricsQuery({
      client: remoteAppClient,
      skip: !currentProject,
    });

  const metricsLoading =
    functionMetricsLoading || projectMetricsLoading || remoteAppMetricsLoading;
  // metrics for database
  const usedDatabase = projectMetrics?.postgresVolumeUsage.value || 0;
  const totalDatabase = projectMetrics?.postgresVolumeCapacity.value || 0;

  // metrics for storage
  const usedStorage =
    remoteAppMetricsData?.filesAggregate?.aggregate?.sum?.size || 0;
  const totalStorage = currentProject?.plan?.isFree
    ? 1 * 1000 ** 3 // 1 GB
    : 10 * 1000 ** 3; // 10 GB

  // metrics for users
  const usedUsers = remoteAppMetricsData?.usersAggregate?.aggregate?.count || 0;
  const totalUsers = currentProject?.plan?.isFree ? 10000 : 100000;

  // metrics for functions
  const usedFunctions = functionsInfoData?.app.metadataFunctions.length || 0;
  const totalFunctions = currentProject?.plan?.isFree ? 10 : 50;

  if (metricsLoading) {
    return (
      <div className="grid grid-flow-row content-start gap-6">
        <UsageProgress label="Database" percentage={0} />
        <UsageProgress label="Storage" percentage={0} />
        <UsageProgress label="Users" percentage={0} />
        <UsageProgress label="Functions" percentage={0} />
      </div>
    );
  }

  if (!isPlatform) {
    return (
      <div className="grid grid-flow-row content-start gap-6">
        <UsageProgress
          label="Database"
          used={prettifySize(0)}
          percentage={100}
        />

        <UsageProgress
          label="Storage"
          used={prettifySize(usedStorage)}
          percentage={100}
        />

        <UsageProgress label="Users" used={usedUsers} percentage={100} />

        <UsageProgress
          label="Functions"
          used={usedFunctions}
          percentage={100}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-flow-row content-start gap-6">
      <UsageProgress
        label="Database"
        used={prettifySize(usedDatabase)}
        total={prettifySize(totalDatabase)}
        percentage={(usedDatabase / totalDatabase) * 100}
      />

      <UsageProgress
        label="Storage"
        used={prettifySize(usedStorage)}
        total={prettifySize(totalStorage)}
        percentage={(usedStorage / totalStorage) * 100}
      />

      <UsageProgress
        label="Users"
        used={usedUsers}
        total={totalUsers}
        percentage={(usedUsers / totalUsers) * 100}
      />

      <UsageProgress
        label="Functions"
        used={usedFunctions}
        total={totalFunctions}
        percentage={(usedFunctions / totalFunctions) * 100}
      />
    </div>
  );
}

export default function OverviewUsage() {
  return (
    <div className="grid grid-flow-row content-start gap-6">
      <Text variant="h3">Usage</Text>
      <RetryableErrorBoundary>
        <OverviewUsageMetrics />
      </RetryableErrorBoundary>
    </div>
  );
}
