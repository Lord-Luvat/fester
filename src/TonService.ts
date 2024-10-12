import {
    type OpenedContract,
    type MessageRelaxed,
    type TonClient,
    type StateInit,
    WalletContractV4,
    // safeSignVerify,
    beginCell,
    internal,
    safeSign,
    type Cell,
} from '@ton/ton';
import { type ServiceBaseProps, type IServiceBase, ServiceBase } from './ServiceBase';
import { type BIP32Interface } from 'bip32';

export interface ITonService extends IServiceBase {
    readonly publicKey: string;
    readonly address: string;
    getBalance: () => Promise<bigint>;
    deployWallet: (wallet: WalletContractV4, secretKey: Uint8Array) => Promise<void>;
    getSeqno: (wallet: WalletContractV4) => Promise<number>;
    createInternalMessage: (params: {
        toAddress?: string;
        amount?: string;
        body?: Cell | string;
        bounce?: boolean;
        init?: StateInit;
    }) => MessageRelaxed;
    createUnsignedMessage: (params: {
        messages: MessageRelaxed[];
        sendMode?: number;
    }) => Promise<{ unsignedMessage: Cell; messageHash: Buffer }>;
    createTransfer: (params: {
        toAddress: string;
        amount: string;
        body?: Cell | string;
        bounce?: boolean;
        init?: StateInit;
        sendMode?: number;
    }) => Promise<void>;
}

type TonServiceParams = {
    root: BIP32Interface;
    client: TonClient;
} & ServiceBaseProps;

type TWalletContract = OpenedContract<WalletContractV4>;

export class TonService extends ServiceBase implements ITonService {
    private readonly client: TonClient;
    private readonly path: string;
    private readonly key: BIP32Interface;
    private readonly wallet: WalletContractV4;
    private readonly contractWallet: TWalletContract;

    constructor(params: TonServiceParams) {
        const { client, root, ...rest } = params;
        super(rest);
        this.client = client;
        this.path = "m/44'/396'/0'/0/0";
        this.key = root.derivePath(this.path);
        this.wallet = WalletContractV4.create({
            workchain: 0,
            publicKey: this.key.publicKey,
        });
        this.contractWallet = client.open(this.wallet);
    }

    get publicKey(): string {
        return this.key.publicKey.toString('hex');
    }

    get address(): string {
        // TODO: check that this is the right format, there are some alternate methods
        // on wallet.address to return different formats
        return this.wallet.address.toString();
    }

    private get _privateKey(): Buffer {
        const privateKey = this.key.privateKey;
        if (privateKey === undefined) {
            throw new Error('privateKey undefined for key derived from BIP32Interface root');
        }
        return privateKey;
    }

    async getBalance(): Promise<bigint> {
        return await this.contractWallet.getBalance();
    }

    async deployWallet(): Promise<void> {
        const seqno = await this.getSeqno();

        const transfer = await this.contractWallet.createTransfer({
            seqno,
            sendMode: 3,
            messages: [],
            stateInit: this.wallet.init,
            secretKey: this._privateKey,
        });
    }

    async getSeqno(): Promise<number> {
        return await this.contractWallet.getSeqno();
    }

    createInternalMessage({
        toAddress,
        amount,
        body,
        bounce,
        init,
    }: {
        toAddress?: string;
        amount?: string;
        body?: Cell | string;
        bounce?: boolean;
        init?: StateInit;
    }): MessageRelaxed {
        return internal({
            to: toAddress ?? this.address,
            value: amount ?? '0',
            body,
            bounce,
            init,
        });
    }

    async signMessage(unsignedMessage: Cell, messageHash: Buffer): Promise<Cell> {
        const signature = safeSign(unsignedMessage, this._privateKey);
        const signedMessage = beginCell()
            .storeBuffer(signature)
            .storeRef(unsignedMessage)
            .endCell();
        return signedMessage;
    }

    async createUnsignedMessage({
        messages,
        sendMode,
    }: {
        messages: MessageRelaxed[];
        sendMode?: number;
    }): Promise<{ unsignedMessage: Cell; messageHash: Buffer }> {
        let messageHash;
        const unsignedMessage = await this.contractWallet.createTransfer({
            seqno: await this.getSeqno(),
            sendMode,
            messages,
            signer: async (message) => {
                messageHash = message.hash();
                return Buffer.alloc(0);
            },
        });

        messageHash = Buffer.alloc(0);
        return { unsignedMessage, messageHash };
    }

    async createTransfer({
        toAddress,
        amount,
        body,
        bounce,
        init,
        sendMode,
    }: {
        toAddress: string;
        amount: string;
        body?: Cell | string;
        bounce?: boolean;
        init?: StateInit;
        sendMode?: number;
    }): Promise<void> {
        const message = this.createInternalMessage({
            toAddress,
            amount,
            body,
            bounce,
            init,
        });

        const { unsignedMessage, messageHash } = await this.createUnsignedMessage({
            messages: [message],
            sendMode,
        });

        const signedMessage = await this.signMessage(unsignedMessage, messageHash);

        const signedBoc = signedMessage.toBoc();
        try {
            await this.client.sendFile(signedBoc);
            this._logger.info(signedBoc, 'Transaction broadcast successfully');
        } catch (error) {
            this._logger.error(error, '');
        }
    }
}
