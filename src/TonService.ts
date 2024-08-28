import TonWeb, { type AddressType } from 'tonweb';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
// import { Address } from 'tonweb';
import {
    type ServiceBaseProps,
    type IServiceBase,
    ServiceBase,
} from './ServiceBase';
import { type WalletV3ContractR1 } from 'tonweb/dist/types/contract/wallet/v3/wallet-v3-contract-r1';
import { createPrivateKey, createPublicKey, type KeyObject } from 'crypto';
import { type BIP32Interface } from 'bip32';

export interface ITonService extends IServiceBase {
    readonly publicKey: string;
    readonly privateKey: Uint8Array;
    readonly address: string;
    init: () => Promise<void>;
    deployWallet: (
        wallet: WalletV3ContractR1,
        secretKey: Uint8Array,
    ) => Promise<void>;
    getSeqno: (wallet: WalletV3ContractR1) => Promise<number>;
    transfer: () => Promise<void>;
    /* listen: (f: (result: any) => any) => Promise<void>;
    fetchBlockTransactions: (blockNumber: number) => Promise<any>;
    setFeeEstimates: () => Promise<void>; */
}

type TonServiceParams = {
    root: BIP32Interface;
    tonweb: TonWeb;
} & ServiceBaseProps;

export class TonService extends ServiceBase implements ITonService {
    private readonly tonweb;
    private readonly path;
    private readonly key;
    /* private readonly privateKeyObject;
    private readonly publicKeyObject; */
    private readonly wallet;
    private addressObject: InstanceType<TonWeb['Address']> | undefined;
    private nonBounceableAddress: string | undefined;

    constructor(params: TonServiceParams) {
        const { tonweb, root, ...rest } = params;
        super(rest);
        this.tonweb = tonweb;
        this.path = "m/44'/396'/0'/0/0";
        this.key = root.derivePath(this.path);
        /* this.privateKeyObject = createPrivateKey({
            key: this.privateKeyBuffer,
            format: 'der',
            type: 'pkcs8',
            encoding: 'buffer',
        });
        this.publicKeyObject = createPublicKey(this.privateKeyObject); */
        this.wallet = this.tonweb.wallet.create({
            publicKey: this.publicKey,
        });
    }

    get publicKey(): string {
        return this.key.publicKey.toString('hex');
    }

    get privateKey(): Uint8Array {
        const privateKey = this.key.privateKey;
        if (privateKey === undefined) {
            throw new Error(
                'privateKey undefined for key derived from BIP32Interface root',
            );
        }
        return new Uint8Array(privateKey);
    }

    get address(): string {
        if (this.addressObject === undefined) {
            throw new Error(
                'addressObject is undefined. Have you run and awaited init() ?',
            );
        }
        return this.addressObject.toString(true, true, false);
    }

    async init(): Promise<void> {
        this.addressObject = await this.wallet.getAddress();
        this.nonBounceableAddress = this.address;
        await this.deployWallet(this.wallet, this.privateKey);
    }

    async deployWallet(
        wallet: WalletV3ContractR1,
        secretKey: Uint8Array,
    ): Promise<void> {
        await wallet.deploy(secretKey).send();
    }

    async getSeqno(wallet: WalletV3ContractR1): Promise<number> {
        const seqno = await wallet.methods.seqno().call();
        if (seqno === undefined) {
            throw new Error(
                `Unable to retrieve sequence number for given wallet(${wallet.address?.toString()})`,
            );
        }
        return seqno;
    }

    /**
     * Currently the transfer method is just for testing, and so for ease sends
     * a basic transaction from itself to itself with the wallet defined on the
     * TON service itself.
     * @param wallet The wallet object from which a transaction will be sent
     */
    async transfer(): Promise<void> {
        const seqno = await this.getSeqno(this.wallet);
        const toAddress = this.address;
        const fee = await this.wallet.methods
            .transfer({
                toAddress,
                secretKey: this.privateKey,
                amount: TonWeb.utils.toNano(0.01),
                seqno,
                payload: 'Hello TON',
                sendMode: 3,
            })
            .estimateFee();

        const Cell = TonWeb.boc.Cell;
        const cell = new Cell();
        cell.bits.writeUint(0, 32);
        cell.bits.writeAddress(this.addressObject);
        cell.bits.writeGrams(1);
        this._logger.info({}, cell.print());

        const bocBytes = cell.toBoc();
        const history = await this.tonweb.getTransactions(this.address);
        const balance = await this.tonweb.getBalance(this.address);
    }
    /* private readonly _tonweb: TonWeb;
    private readonly _wallet: WalletV3ContractR1;
    private readonly _latestBlockNumber?: number;
  private readonly _privateKeyBuffer: Buffer;
  private readonly _privateKeyObject: KeyObject;
  private readonly _publicKeyObject: KeyObject;
  private _address: ;
  private _nonBounceableAddress;
  private _isFeeCurrent = false;

  constructor(props: TonServiceProps) {
    const { tonweb, privateKeyBuffer, ...rest } = props;
    super(rest);
    this._tonweb = tonweb;
    this._privateKeyBuffer = privateKeyBuffer;
    this._privateKeyObject = createPrivateKey({
      key: this._privateKeyBuffer,
      format: 'der',
      type: 'pkcs8',
      encoding: 'buffer',
    });
    this._publicKeyObject = createPublicKey(this._privateKeyObject);
    this._wallet = tonweb.wallet.create({
      publicKey: this.publicKey,
    });
  }

  public async init(): Promise<void> {
    this._address = await this._wallet.getAddress();
    this._nonBounceableAddress = this._address.toString(true, true, false);
  }

  get publicKey(): string {
    return this._pemToBuffer(
      this._publicKeyObject.export({ type: 'spki', format: 'pem' }).toString(),
    ).toString('hex');
  }

  get latestBlockNumber(): number | undefined {
    return this._latestBlockNumber;
  }

  get isFeeCurrent(): boolean {
    return this._isFeeCurrent;
  }

  private _pemToBuffer(pem: string): Buffer {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length,
    );
    const binaryDerString = Buffer.from(pemContents, 'base64').toString(
      'binary',
    );
    return Buffer.from(binaryDerString, 'binary');
  }

  private _generateEd25519KeyPair() {
        this._privateKeyObject = createPrivateKey({
            key: this._privateKeyBuffer,
            format: 'der',
            type: 'pkcs8',
            encoding: 'buffer',
        });

        this._publicKeyObject = createPublicKey(this._privateKeyObject);
    }

    private async generateEd25519KeyPair(): Promise<{ publicKey: Buffer; privateKey: Buffer }> {
        return new Promise((resolve, reject) => {
            generateKeyPair(
                'ed25519',
                {},
                (error, publicKey, privateKey) => {
                    if (error) {
                        return reject(error);
                    }

                    // Convert PEM to Buffer (DER format)
                    const publicKeyBuffer = this.pemToBuffer(publicKey.export({ type: 'spki', format: 'pem' }).toString());
                    const privateKeyBuffer = this.pemToBuffer(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());

                    resolve({
                        publicKey: publicKeyBuffer,
                        privateKey: privateKeyBuffer
                    })
                }
            );
        });
    } 

  public async listen(func: (result: any) => any): Promise<void> {
    try {
      setInterval(async () => {
        const currentBlockNumber = await this.getLatestBlockNumber();
        if (currentBlockNumber !== this._latestBlockNumber) {
          this._latestBlockNumber = currentBlockNumber;
          func(currentBlockNumber);
        }
      }, 10000); // Poll every 10 seconds
    } catch (error) {
      this._logger.error(error, 'Error in listen function:');
    }
  }
   

  public async listenForNewBlocksAndCheckTransactions(
    monitoredAddresses: string[],
    callback: (tx: any) => void,
  ): Promise<void> {
    let lastBlockNumber: number | undefined;

    setInterval(async () => {
      try {
        const currentBlockNumber = await this.getLatestBlockNumber();

        if (currentBlockNumber && currentBlockNumber !== lastBlockNumber) {
          lastBlockNumber = currentBlockNumber;

          const transactions =
            await this.getBlockTransactions(currentBlockNumber);
          if (transactions) {
            for (const tx of transactions) {
              const toAddress = tx.in_msg.dest; // Assuming 'dest' contains the destination address
              if (monitoredAddresses.includes(toAddress)) {
                callback(tx);
              }
            }
          }
        }
      } catch (error) {
        this._logger.error('Error in block monitoring:', error);
      }
    }, 10000); // Poll every 10 seconds
  }

  private async getBlockTransactions(blockNumber: number): Promise<any[]> {
    try {
      const blockInfo = await this._tonweb.provider.getBlock(blockNumber);
      // Assuming `blockInfo.transactions` gives you the list of transactions in that block
      return blockInfo.transactions || [];
    } catch (error) {
      this._logger.error('Error fetching block transactions:', error);
      return [];
    }
  }

  public async fetchBlockTransactions(blockNumber: number): Promise<any> {
    // Fetching block details could be done via an API or TON SDK if available.
    // This would depend on the available TON APIs and their SDK.
    try {
      const block =
        await this._tonweb.provider.getBlockTransactions(blockNumber);
      return block;
    } catch (error) {
      this._logger.error(
        error,
        `[${this.constructor.name}] fetchBlockTransactions failed with error:`,
      );
      return null;
    }
  }

  public async setFeeEstimates(): Promise<void> {
    try {
      // Implement fee estimation logic here if possible
      this._isFeeCurrent = true; // Update based on logic
    } catch (error) {
      this._logger.error('Error setting fee estimates:', error);
    }
  }

  public async sendTransaction(
    toAddress: string,
    amount: number,
    payload?: string,
  ): Promise<void> {
    try {
      const to = new TonWeb.Address(toAddress);
      const seqno = await this._wallet.methods.seqno().call(); // Get the current seqno

      if (seqno === undefined) {
        this._logger.error(this._wallet, 'Error retrieving seqno for wallet');
        return;
      }

      const payloadBytes =
        payload !== undefined
          ? this._tonweb.utils.base64ToBytes(payload)
          : undefined;

      const transfer = await this._wallet.methods
        .transfer({
          secretKey: this._privateKeyBuffer, // Buffer containing the private key
          toAddress: to,
          amount,
          seqno,
          payload: payloadBytes, // Convert payload if it exists
          sendMode: 3, // Example send mode, adjust as needed
        })
        .send();

      console.log('Transaction sent:', transfer);
    } catch (error) {
      this._logger.error(error, 'Error sending transaction:');
    }
  }

  public async getBalance(address: string): Promise<number> {
    try {
      const walletAddress = new TonWeb.Address(address);
      const balanceInfo = await this._tonweb.provider.getBalance(walletAddress);
      return balanceInfo / 1e9; // Convert nanoTONs to TONs
    } catch (error: unknown) {
      this._logger.error(error, 'Error fetching balance:');
      return 0;
    }
  } */
}
