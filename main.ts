import {
	App,
	Editor, FileSystemAdapter,
	MarkdownView,
	Modal,
	Notice,
	parseFrontMatterEntry,
	Plugin,
	PluginSettingTab,
	Setting, TFile
} from 'obsidian';


import {isMetaProperty} from "tsutils";

// Remember to rename these classes and interfaces!

interface SyncNoteSettings {
	SettingDestinationFolder: string;
}

const DEFAULT_SETTINGS: SyncNoteSettings = {
	SettingDestinationFolder: 'default'
}

export default class NotesSync extends Plugin {
	settings: SyncNoteSettings;

	async onload() {
		await this.loadSettings();
		console.log("Hello world: " + this.settings.SettingDestinationFolder);



		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SyncNoteSettingTab(this.app, this));

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'toggle-note-sync',
			name: 'Toggle the note sync between true and false.',
			callback: () => {
				console.log("Command toggle notes sync " + this.settings.SettingDestinationFolder);
			}
		});

		this.registerEvent(

			this.app.vault.on('modify', (file:TFile) => {
			try {

				console.log('TRIGGER FROM MODIFY ' + file.name + ' p:' + file.path);
				const fileContent = (this.app.vault.read(file));
				console.log("fc STGART");
				console.log(fileContent);
				console.log("fc END");
				this.app.fileManager.processFrontMatter(
					file,
					(frontmatter) => {
						this.log('current metadata: ', frontmatter);
						if (frontmatter['notesync'] == "true") {
							this.log("NOTES SYNC == TRUE will sync file: " + file.path);
							this.log("NOTES SYNC vault: " + file.vault.getAbstractFileByPath(file.path)?.path);

							const activeFile = this.app.workspace.getActiveFile()?.path;
							const path = require('path');
							let absPath = path.resolve(activeFile);
							this.log("NOTES SYNC absPath: " + absPath);
							// var current_path_to_locales_dir = path.join(__dirname, "..", "locale");
							// this.log("NOTES SYNC currPath: " + current_path_to_locales_dir);
							// [UTOE]: NOTES SYNC currPath: /Applications/Obsidian.app/Contents/Resources/electron.asar/locale
							this.log("NOTES SYNC superPath: " +getVaultAbsolutePath(app));

						}

					});


			} catch (e: any) {
					if (e?.name === 'YAMLParseError') {
						const errorMessage = `Update time on edit failed Malformed frontamtter on this file : ${file.path} ${e.message}`;
						new Notice(errorMessage, 4000);
						console.error(errorMessage);
						return {
							status: 'error',
							error: e,
						};
					}
				}


			}),
		);


		function getVaultAbsolutePath(app: App) {
			// The below two lines were copied 2021-08-22 from https://github.com/phibr0/obsidian-open-with/blob/84f0e25ba8e8355ff83b22f4050adde4cc6763ea/main.ts#L66-L67
			// @ts-ignore
			let adapter = app.vault.adapter;

			if (adapter instanceof FileSystemAdapter) {
				return adapter.getBasePath();
			}
			return null;
		}

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	log(...data: any[]) {
		console.log('[UTOE]:', ...data);
	}



}



class SyncNoteSettingTab extends PluginSettingTab {
	plugin: NotesSync;

	constructor(app: App, plugin: NotesSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Destination folder')
			.setDesc('Enter the root folder of your destination Obsidian vault')
			.addText(text => text
				.setPlaceholder('Directory name')
				.setValue(this.plugin.settings.SettingDestinationFolder)
				.onChange(async (value) => {
					this.plugin.settings.SettingDestinationFolder = value;
					await this.plugin.saveSettings();
				}));
	}



}
