import type { Bot } from 'mirai-js';
import type { LogOptions } from './lib/logging';

declare module 'obsidian' {
	interface App {
		setting: {
			containerEl: HTMLElement;
			openTabById(id: string): void;
			pluginTabs: Array<{
				id: string;
				name: string;
				instance?: {
					description: string;
					id: string;
					name: string;
				};
			}>;
			activeTab: SettingTab;
			open(): void;
		};
		commands: {
			executeCommandById(id: string): void;
			commands: {
				[key: string]: Command;
			};
		};
		plugins: {
			plugins: {
				[key: string]: { manifest: PluginManifest };
				'obsidian-hover-editor': {
					spawnPopover(initiatingEl?: HTMLElement, onShowCallback?: () => unknown): WorkspaceLeaf;
					manifest: PluginManifest;
				};
				metaedit: {
					api: {
						update(propertyName: string, propertyValue: string, file: TFile | string): any;
						getPropertiesInFile(file: TFile | string): any;
					};
					manifest: PluginManifest;
				};
				'periodic-notes': {
					settings: {
						daily: {
							folder: string;
							format: string;
						};
					};
					manifest: PluginManifest;
				};
			};
			enablePluginAndSave(plugin: string): void;
			disablePluginAndSave(plugin: string): void;
		};
		internalPlugins: {
			plugins: {
				[key: string]: {
					instance: {
						description: string;
						id: string;
						name: string;
					};
					enabled: boolean;
				};
				workspaces: {
					instance: {
						description: string;
						id: string;
						name: string;
						activeWorkspace: Workspace;
						saveWorkspace(workspace: Workspace): void;
						loadWorkspace(workspace: string): void;
					};
					enabled: boolean;
				};
			};
		};
	}
}
export interface MiraiBotSettings {
	botConfig: {
		baseUrl: string;
		verifyKey: string;
		qq: number | undefined;
	};
	myQQ: number | undefined;
	autoLaunch: boolean;
	note: {
		folder: string;
		format: string;
		stayWithPN: boolean;
	};
	autoCreateDailyNote: boolean;
	tempFolder: string;
	// Logging options.
	loggingOptions: LogOptions;
	timelineIdentifier: string;
	templates: { [key: string]: string };
	enableImageUpload: boolean;
	imageFolder: string;
	youzackIndex: number;
}
export interface Message {
	type: 'Plain' | 'Image' | 'Source' | 'App' | 'MusicShare' | 'Quote';
	id?: number;
	text?: string;
	content?: string;
}
export interface BotData {
	bot: Bot;
	messageChain: Message[];
	sender: {
		id: number;
	};
	text: string;
	type: any;
	unlock: () => any;
	waitFor: {
		friend: (qq: number) => any;
		text: () => any;
		messageChain: () => Message[];
	};
	eventId: any;
	groupId: any;
	fromId: any;
	groupName: any;
	nick: any;
	message: any;
}
export interface Parameters {
	type: 'image' | 'plain';
	content: string;
	source: string;
	title: string;
}
export interface ActivityRecord {
	time: string;
	category: string;
	brief: string;
	briefLink: string;
	details: RecordDetail[];
}
export interface RecordDetail {
	type: 'image' | 'text' | 'iframe' | 'audio' | 'internalLink' | 'externalLink' | 'link';
	content: string;
}
