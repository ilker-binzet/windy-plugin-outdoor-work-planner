import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-outdoor-work-planner',
    version: '0.1.0',
    icon: '🛠️',
    title: 'Outdoor Work Planner',
    description:
        'Find weather windows for outdoor work based on your task, schedule, and weather limits.',
    author: 'Ilker Binzet',
    repository: 'https://github.com/ilker-binzet/windy-plugin-outdoor-work-planner',
    homepage: 'https://ca.linkedin.com/in/binzet-me',
    desktopUI: 'rhpane',
    desktopWidth: 520,
    mobileUI: 'fullscreen',
    routerPath: '/outdoor-work-planner/:lat?/:lon?',
    addToContextmenu: true,
    listenToSingleclick: true,
    private: false,
};

export default config;
