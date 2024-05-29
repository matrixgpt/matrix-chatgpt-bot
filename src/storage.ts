import Keyv from "keyv";
import { KeyvFile } from "keyv-file";
import * as sha512 from "hash.js/lib/hash/sha/512.js";
import * as path from "node:path";
import type {
	IAppserviceStorageProvider,
	IFilterInfo,
	IStorageProvider,
} from "matrix-bot-sdk";
import { DATA_PATH, KEYV_BACKEND, KEYV_URL } from "./env.js";

/**
 * A storage provider that uses the disk to store information.
 * @category Storage providers
 */
export class KeyvStorageProvider
	implements IStorageProvider, IAppserviceStorageProvider
{
	private completedTransactions = [];
	private db: Keyv;

	/**
	 * Creates a new simple file system storage provider.
	 * @param {Keyv} keyvStore A Keyv instance for storing data.
	 */
	constructor(
		namespace: string,
		name: string,
		private trackTransactionsInMemory = true,
		private maxInMemoryTransactions = 20,
	) {
		if (KEYV_BACKEND === "file") {
			this.db = new Keyv({
				store: new KeyvFile({
					filename: path.join(DATA_PATH, namespace, `${name}.json`),
				}),
			});
		} else {
			this.db = new Keyv(KEYV_URL, { namespace: namespace });
		}
		this.db.set("syncToken", null);
		this.db.set("filter", null);
		this.db.set("appserviceUsers", {}); // userIdHash => { data }
		this.db.set("appserviceTransactions", {}); // txnIdHash => { data }
		this.db.set("kvStore", {}); // key => value (str)
	}

	setSyncToken(token: string | null): Promise<any> | void {
		this.db.set("syncToken", token);
	}

	getSyncToken(): string | Promise<string | null> | null {
		return this.db.get("syncToken");
	}

	setFilter(filter: IFilterInfo): void {
		this.db.set("filter", filter);
	}

	getFilter(): IFilterInfo | Promise<IFilterInfo> {
		return this.db.get("filter");
	}

	addRegisteredUser(userId: string): Promise<any> | void {
		const key = sha512().update(userId).digest("hex");
		this.db.set(`appserviceUsers.${key}.userId`, userId);
		this.db.set(`appserviceUsers.${key}.registered`, true);
	}

	isUserRegistered(userId: string): boolean | Promise<boolean> {
		const key = sha512().update(userId).digest("hex");
		return this.db.get(`appserviceUsers.${key}.registered`);
	}

	isTransactionCompleted(transactionId: string): boolean | Promise<boolean> {
		if (this.trackTransactionsInMemory) {
			return this.completedTransactions.indexOf(transactionId) !== -1;
		}

		const key = sha512().update(transactionId).digest("hex");
		return this.db.get(`appserviceTransactions.${key}.completed`);
	}

	setTransactionCompleted(transactionId: string): Promise<any> | void {
		if (this.trackTransactionsInMemory) {
			if (this.completedTransactions.indexOf(transactionId) === -1) {
				this.completedTransactions.push(transactionId);
			}
			if (this.completedTransactions.length > this.maxInMemoryTransactions) {
				this.completedTransactions = this.completedTransactions
					.reverse()
					.slice(0, this.maxInMemoryTransactions)
					.reverse();
			}
			return;
		}

		const key = sha512().update(transactionId).digest("hex");
		this.db.set(`appserviceTransactions.${key}.txnId`, transactionId);
		this.db.set(`appserviceTransactions.${key}.completed`, true);
	}

	readValue(
		key: string,
	): string | Promise<string | null | undefined> | null | undefined {
		return this.db.get(key);
	}

	storeValue(key: string, value: string): Promise<any> | void {
		this.db.set(key, value);
	}

	storageForUser(userId: string): IStorageProvider {
		return new NamespacedKeyvProvider(userId, this);
	}
}

/**
 * A namespaced storage provider that uses the disk to store information.
 * @category Storage providers
 */
class NamespacedKeyvProvider implements IStorageProvider {
	constructor(
		private prefix: string,
		private parent: KeyvStorageProvider,
	) {}

	setFilter(filter: IFilterInfo): Promise<any> | void {
		return this.parent.storeValue(
			`${this.prefix}_int_filter`,
			JSON.stringify(filter),
		);
	}

	getFilter(): IFilterInfo | Promise<IFilterInfo> {
		return Promise.resolve(
			this.parent.readValue(`${this.prefix}_int_filter`),
		).then((r) => (r ? JSON.parse(r) : r));
	}

	setSyncToken(token: string | null): Promise<any> | void {
		return this.parent.storeValue(`${this.prefix}_int_syncToken`, token || "");
	}

	getSyncToken(): string | Promise<string | null> | null {
		return Promise.resolve(
			this.parent.readValue(`${this.prefix}_int_syncToken`),
		).then((r) => r ?? null);
	}

	readValue(
		key: string,
	): string | Promise<string | null | undefined> | null | undefined {
		return this.parent.readValue(`${this.prefix}_kv_${key}`);
	}

	storeValue(key: string, value: string): Promise<any> | void {
		return this.parent.storeValue(`${this.prefix}_kv_${key}`, value);
	}
}
