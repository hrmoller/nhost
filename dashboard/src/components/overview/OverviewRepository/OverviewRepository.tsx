import { GitHubIcon } from '@/components/common/GitHubIcon';
import { useUI } from '@/context/UIContext';
import { useCurrentWorkspaceAndProject } from '@/hooks/v2/useCurrentWorkspaceAndProject';
import Box from '@/ui/v2/Box';
import Button from '@/ui/v2/Button';
import Text from '@/ui/v2/Text';
import NavLink from 'next/link';

export default function OverviewRepository() {
  const { currentWorkspace, currentProject } = useCurrentWorkspaceAndProject();
  const { maintenanceActive } = useUI();

  return (
    <div>
      <Text variant="h3">Repository</Text>
      <Text variant="subtitle1" className="mt-2 !font-medium">
        {!currentProject.githubRepository
          ? 'Connect your project with a GitHub repository to create your first deployment.'
          : 'GitHub is connected.'}
      </Text>
      {!currentProject.githubRepository ? (
        <div className="mt-6 flex flex-row place-content-between rounded-lg">
          <NavLink
            href={`/${currentWorkspace.slug}/${currentProject.slug}/settings/git`}
            passHref
          >
            <Button
              variant="outlined"
              color="secondary"
              className="w-full border-1 hover:border-1"
              startIcon={<GitHubIcon />}
              disabled={maintenanceActive}
            >
              Connect to GitHub
            </Button>
          </NavLink>
        </div>
      ) : (
        <Box
          className="mt-6 flex flex-row place-content-between rounded-lg p-2"
          sx={{ backgroundColor: 'grey.200' }}
        >
          <Box
            className="ml-2 grid grid-flow-col gap-1.5"
            sx={{ backgroundColor: 'transparent' }}
          >
            <GitHubIcon className="h-4 w-4 self-center" />
            <Text variant="body1" className="self-center font-normal">
              {currentProject.githubRepository.fullName}
            </Text>
          </Box>

          <NavLink
            href={`/${currentWorkspace.slug}/${currentProject.slug}/settings/git`}
            passHref
          >
            <Button
              variant="borderless"
              size="small"
              disabled={maintenanceActive}
            >
              Edit
            </Button>
          </NavLink>
        </Box>
      )}
    </div>
  );
}
