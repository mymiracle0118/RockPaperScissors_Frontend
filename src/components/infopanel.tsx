import { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import axios from 'axios'
import {WalletConnect} from '../wallet'
import { styled } from '@mui/material/styles';
import { IconButton, Drawer, Divider} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import { LAMPORTS_PER_SOL, Connection, SystemProgram, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import {notification} from 'antd'
const bs58 = require('bs58')

let wallet : any;
// let conn = new Connection("https://solana-api.projectserum.com")
let conn = new Connection(clusterApiUrl("devnet"))
let treasuryWallet = new PublicKey("7Q1C41J6hoKhbdvhneaQe2hYbQi4nREfdurgtAE1krCL")
const SEVERURL = "http://localhost:5000/"

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	textAlign : "center",
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
	justifyContent: 'flex-start',
}));

export default function InfoPanel(){
    wallet = useWallet()

    const [openSettingPanel, setOpenSettingPanel] = useState(false)
	const [walletAmount, setWalletAmount] = useState(0)
	const [depositAmount, setDepositAmount] = useState(0)
	const [walletAmountStr, setWalletAmountStr] = useState('')
	const [depositAmountStr, setDepositAmountStr] = useState('')
	const [inputDeposit, setInputDeposit] = useState("")
	const [inputWithdraw, setInputWithdraw] = useState("")
	const [isInvalidWalletAmount, setIsInvalidWalletAmount] = useState(false)
	const [isInvalidDepositAmount, setIsInvalidDepositAmount] = useState(false)

    useEffect(()=>{
		const interval = setInterval(()=>{
            getSolAmountInfo()
        },20000)
        return ()=> clearInterval(interval)
	},[])

    useEffect(()=>{
        getSolAmountInfo()
        if(wallet.connected===false) setOpenSettingPanel(false)
    },[wallet])

	async function getSolAmountInfo(){
        if(wallet.connected){
            try{
                let amount = (await conn.getBalance(wallet.publicKey))/LAMPORTS_PER_SOL
                let roundAmount = Math.round(amount*1000) / 1000
                setWalletAmount(amount * LAMPORTS_PER_SOL)
                setWalletAmountStr(Math.abs(roundAmount-amount) > 0.0005 ? '~'+roundAmount : roundAmount.toString())
            }catch(err){
                setWalletAmount(0)
                setWalletAmountStr('0')
            }
            try{
                axios.get(SEVERURL+"rpsgame/wallet?wallet="+wallet.publicKey.toBase58()).then((response)=>{
                    let amount = response.data.data.amount / LAMPORTS_PER_SOL
                    let roundAmount = Math.round(amount*1000) / 1000
                    setDepositAmount(response.data.data.amount)
                    setDepositAmountStr(Math.abs(roundAmount-amount) > 0.005 ? '~'+roundAmount : roundAmount.toString())
                })
            }catch(err){
                setDepositAmount(0)
                setDepositAmountStr('0')
            }
        }else{
            setWalletAmount(0)
            setWalletAmountStr('0')
            setDepositAmount(0)
            setDepositAmountStr('0')
        }
	}

	const depositSol = async()=> {
		try{
			let transaction = new Transaction()
			let lamports = Number(inputDeposit) * LAMPORTS_PER_SOL
			transaction.add(SystemProgram.transfer({
				fromPubkey : wallet.publicKey,
				toPubkey : treasuryWallet,
				lamports : lamports
			}))
			transaction.feePayer = wallet.publicKey
			transaction.recentBlockhash = (await conn.getRecentBlockhash('max')).blockhash
			await transaction.setSigners(wallet.publicKey)
			const signedTransaction = await wallet.signTransaction(transaction)
			openNotification('info', "Transaction Sent")
			let response = await axios.post(SEVERURL+"rpsgame/deposit",{
				wallet: wallet.publicKey,
				amount : lamports,
				transaction : await signedTransaction.serialize()
			})
			if(response.data.response===true){
				openNotification('success', "Deposit Success")
			}else{
				openNotification('error', "Deposit Failed")
			}
			getSolAmountInfo()
		}catch(err){
			openNotification('error', "Deposit Failed")
		}
	}

	const withdrawSol = async()=> {
		try{
			let preResponse = await axios.post(SEVERURL+"rpsgame/prewithdraw",{wallet : wallet.publicKey})
			if(preResponse.data.response===false){
				throw new Error("Nonce Error")
			}
			let nonce = preResponse.data.nonce
			let message = `Withdraw Request : ${nonce}`
			const data = new TextEncoder().encode(message)
			const signature = bs58.encode(await wallet.signMessage(data))
			openNotification('info', "Transaction Sent")
			let response = await axios.post(SEVERURL+"rpsgame/withdraw",{wallet : wallet.publicKey, amount : Number(inputWithdraw)*LAMPORTS_PER_SOL, signature : signature})
			if(response.data.response===true){
				openNotification('success', "Withdraw Success")
			}else{
				openNotification('error', "Withdraw Failed")
			}
			getSolAmountInfo()
		}catch(err){
			openNotification('error', "Withdraw Failed")
		}
	}

    const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
		notification[type]({
			message : title, description : description, placement : 'topLeft'
		})
	}

    return <>
        <IconButton color="primary" sx={{position:'fixed', top : "100px", right : 0}} size="large" onClick={(event)=>{
				setOpenSettingPanel(true)
		}}><SettingsIcon fontSize='large'></SettingsIcon></IconButton>
        <Drawer anchor="right" open={openSettingPanel} 
			sx={{minWidth:300 ,width: "40%",'& .MuiDrawer-paper':{borderRadius:"20px 0 0 20px", minWidth:300, width:"40%", backgroundColor:"#F1FAEE"}}}
			onClose={(event)=>{setOpenSettingPanel(false)}}>
			<DrawerHeader>
				<IconButton onClick={(event)=>{setOpenSettingPanel(false)}}><ChevronRightIcon/></IconButton>
				<h3 style={{color : "#777", paddingTop : "10px", width : "90%"}}>SETTING</h3>
			</DrawerHeader>
			<Divider></Divider>
			<div className='p-3 pt-5 pb-5'><WalletConnect/></div>
			<div className="setting-panel mb-5">
				<h6 className='setting-title'>YOUR WALLET HAS <span style={{color : "#457B9D", fontSize : "20px"}}>{walletAmountStr}</span> SOL</h6>
				<div className='setting-group'>
					<button className="setting-button" onClick={async()=>{
						await depositSol()
					}}>Deposit</button>
					<input className={isInvalidWalletAmount ? "setting-input invalid-input" : "setting-input"} name="deposit" type="number" placeholder="0.0" value={inputDeposit} onChange={(event)=>{
						if(Number(event.target.value) > walletAmount/LAMPORTS_PER_SOL || Number(event.target.value) < 0) setIsInvalidWalletAmount(true)
						else setIsInvalidWalletAmount(false)
						setInputDeposit(event.target.value)
					}}></input>
				</div>
			</div>
			<div className="setting-panel">
				<h6 className='setting-title'>YOU HAVE DEPOSITED <span style={{color : "#457B9D", fontSize : "20px"}}>{depositAmountStr}</span> SOL</h6>
				<div className='setting-group'>
					<button className="setting-button withdraw-button" onClick={async()=>{
						await withdrawSol()
					}}>Withdraw</button>
					<input className={isInvalidDepositAmount ? "setting-input invalid-input" : "setting-input"} name="deposit" type="number" placeholder="0.0" value={inputWithdraw} onChange={(event)=>{
						if(Number(event.target.value) > depositAmount/LAMPORTS_PER_SOL || Number(event.target.value) < 0) setIsInvalidDepositAmount(true)
						else setIsInvalidDepositAmount(false)
						setInputWithdraw(event.target.value)
					}}></input>
				</div>
			</div>
		</Drawer>
    </>
}