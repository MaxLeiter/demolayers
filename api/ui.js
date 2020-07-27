const {withUiHook, htm} = require('@vercel/integration-utils')

module.exports = withUiHook(async ({payload, vercelClient}) => {
	const {clientState, action, projectId, integrationId, configurationId} = payload

	let notice = ''
	let connected = false;

	if (!projectId) {
		return htm`
			<Page>
				<ProjectSwitcher />
			</Page>
		`
	}

	const metadata = await vercelClient.getMetadata()
	if (!metadata.attachedProjects) {
		metadata.attachedProjects = []
	} else if (metadata.attachedProjects.includes(projectId)) {
		connected = true;
	}

	if (action === 'submit') {
		try {
			if (!connected) {
				await vercelClient.addConfigurationToProject(projectId)
				metadata.attachedProjects.push(projectId)
				await vercelClient.setMetadata(metadata)
				connected = true;
				notice = htm`<Notice>Successfully connected to project.</Notice>`
			} else {
				notice = htm`<Notice error>Already connected to project.</Notice>`

				connected = true;
			}
		} catch(err) {
			notice = htm`<Notice error>Error: ${err.message}</Notice>`
			connected = false;
		}
	} else if (action === 'disconnect') {
		try {
			if (connected) {
				await vercelClient.removeConfigurationFromProject(projectId)
				metadata.attachedProjects = (metadata.attachedProjects || []).filter(projId => projId !== projectId)
				await vercelClient.setMetadata(metadata)
				connected = false;
				notice = htm`<Notice>Successfully disconnected to project.</Notice>`
			} else {
				connected = false;
				notice = htm`<Notice error>Not connected to project. Could not disconnect.</Notice>`
			}
		} catch(err) {
			notice = htm`<Notice error>Error: ${err.message}</Notice>`
			connected = true;
		}
	}

	let content = ''
	if (!connected) {
		content = htm`
		<Page>
      <Box display="flex" justifyContent="center" margin-bottom="2rem">
        <H1>Layers Demo</H1>
      </Box>
      ${notice}
			<ProjectSwitcher />
			<Container>
				<Button action="submit">Connect</Button>
			</Container>
		</Page>
	`
	} else {
		content = htm`
		<Page>
      <Box display="flex" justifyContent="center" margin-bottom="2rem">
        <H1>Layers Demo</H1>
      </Box>
      	${notice}
			<ProjectSwitcher />
			<Container>
				<Button action="disconnect">Disconnect</Button>
			</Container>
		</Page>
	`
	}

	return content;
})
