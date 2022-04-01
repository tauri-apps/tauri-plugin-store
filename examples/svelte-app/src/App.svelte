<script lang="ts">
	import { Store } from 'tauri-plugin-store-api'

	const key = 'the-key'
	const store = new Store('.settings')

	let response = '';
	let record;

	function _updateResponse(returnValue) {
		response += (typeof returnValue === 'string' ? returnValue : JSON.stringify(returnValue)) + '<br>'
	}

	async function set() {
		await store.set(key, record).catch(_updateResponse)
	}

	async function get() {
		await store.get(key)
			.then(_updateResponse)
			.catch(_updateResponse)
	}

	async function set_broken() {
		const brokenStore = new Store('broken')
		await brokenStore.set('foo', 'bar')
	}

	async function save() {
		await store.save()
	}

	async function load() {
		await store.load()
	}
</script>

<div>
	<button on:click="{save}">Save</button>
	<button on:click="{load}">Load</button>
</div>
<div>
	<input placeholder="The value to store" bind:value={record}>
	<button on:click="{set}">Set</button>
</div>
<div>
	<button on:click="{get}">Get</button>
	<div>{@html response}</div>
</div>
<div>
	<button on:click="{set_broken}">Broken</button>
</div>