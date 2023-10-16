import { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import axios from 'axios'
import { CONST_MESSAGES, WAGER_AMOUNTS } from '../utils/constant'
import {WalletConnect, WalletDisconnect} from '../wallet'
import {Alert, IconButton, Stack, CircularProgress} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import LogPanel from '../components/logpanel';
import Footer from '../components/footer'
import InfoPanel from '../components/infopanel';
import { LAMPORTS_PER_SOL, Connection} from '@solana/web3.js';
import {notification} from 'antd'

import BettingImage from '../assets/image/betting.png'
import LG_PAPER_LEFT  from '../assets/images/LG-PAPER-LEFT.svg'
import LG_ROCK_LEFT  from '../assets/images/LG-ROCK-LEFT.svg'
import LG_SCISSORS_LEFT  from '../assets/images/LG-SCISSORS-LEFT.svg'
import SM_PAPER_LEFT from '../assets/images/SM-PAPER-LEFT.svg'
import SM_ROCK_LEFT  from '../assets/images/SM-ROCK-LEFT.svg'
import SM_SCISSORS_LEFT  from '../assets/images/SM-SCISSORS-LEFT.svg'
import SM_PAPER_RIGHT from '../assets/images/SM-PAPER-RIGHT.svg'
import SM_ROCK_RIGHT  from '../assets/images/SM-ROCK-RIGHT.svg'
import SM_SCISSORS_RIGHT  from '../assets/images/SM-SCISSORS-RIGHT.svg'
import Star1 from '../assets/image/star1.png'
import Star2 from '../assets/image/star2.png'
import Star3 from '../assets/image/star3.png'

import * as nacl from 'tweetnacl'
import * as bs58 from 'bs58'
import { connect } from 'http2';

let wallet : any;
const SEVERURL = "http://localhost:5000/"

const tempLog=[
	{winnerName:"black solana", loserName:"Gambler", amount:0.25},
	{winnerName:"blkgambler", loserName:"stom pow", amount:0.25},
	{winnerName:"RogueShark", loserName:"Eugene", amount:0.25},
	{winnerName:"King", loserName:"Elias", amount:0.25},
]

const RPSNAME = ['Rock','Paper', 'Scissors']
const lgImage = [LG_ROCK_LEFT, LG_PAPER_LEFT, LG_SCISSORS_LEFT]
const smLeftImage = [SM_ROCK_LEFT, SM_PAPER_LEFT, SM_SCISSORS_LEFT]
const smRightImage = [SM_ROCK_RIGHT, SM_PAPER_RIGHT, SM_SCISSORS_RIGHT]
const star = [Star3, Star1, Star2]

export default function Home(){
	wallet = useWallet()
	const prevUserName = localStorage.getItem("userName")
	const [openAlert, setOpenAlert] = useState(true)
	const [recentLog, setRecentLog] = useState<any[]>(tempLog)
	const [userName, setUserName] = useState<string>(prevUserName!==null && prevUserName!==undefined ? prevUserName : "")
	const [selectedAmount, setSelectedAmount] = useState(0)
	const [isCorrectName, setIsCorrectName] = useState(true)
	const [rpsStatus, setRpsStatus] = useState(0)
	const [selectItem, setSelectItem] = useState(0)
	const [isInvitePanel, setIsInvitePanel] = useState(false)
	const [isInviteWaiting, setIsInviteWaiting] = useState(false)
	const [isSelecting, setIsSelecting] = useState(true)
	const [currentState, setCurrentState] = useState<any>(null)
	const [roomNumber, setRoomNumber] = useState(0)
	const [inviteId, setInviteId] = useState(0)

	const [isSigned, setIsSigned] = useState(false)

	useEffect(()=>{
		if(wallet.connected && isSigned) getPlayerStatus()
	},[wallet,isSigned])

	useEffect(()=>{
		if(rpsStatus===1){
			const interval = setInterval(()=>{
				findMatch()
			}, 3000)
			return ()=> clearInterval(interval)
		}else if(rpsStatus===2){
			const interval = setInterval(()=>{
				getGameState()
			},1000)
			return ()=> clearInterval(interval)
		}else if(rpsStatus===3){
			const interval =setInterval(()=>{
				getPlayerStatus()
			},1000)
			return ()=> clearInterval(interval)
		}
	},[rpsStatus])

	async function getPlayerStatus(){
		let res = await axios.get(SEVERURL+'rpsgame/status?wallet='+wallet.publicKey.toBase58())
		if(res.data.status===2){
			setRoomNumber(res.data.roomID)
		}
		if(res.data.status===3){
			setIsInviteWaiting(res.data.isInvite)
		}
		setRpsStatus(res.data.status)
	}

	const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
		notification[type]({
			message : title, description : description, placement : 'topLeft'
		})
	}

	const startMystery = async()=> {
		try{
			// if(depositAmount < WAGER_AMOUNTS[selectedAmount] * LAMPORTS_PER_SOL){
			// 	openNotification('error', "You can't start game",'Your deposit amount is NOT enough. Please deposit more and then try again.')
			// 	throw new Error("Amount Not enough")
			// }
			// setIsWaiting(true)
			setRpsStatus(1)
			let response = await axios.post(SEVERURL+"rpsgame/start/mystery",{wallet : wallet.publicKey, amount : WAGER_AMOUNTS[selectedAmount] * LAMPORTS_PER_SOL, name : userName})
			if(response.data.response===false){
				openNotification('error',"You can't start game.", "Please check your wallet status and deposit amount")
				// setIsWaiting(false)
				setRpsStatus(0)
				throw new Error("Start game error")
			}
		}catch(err){
			console.log(err)
		}
	}

	const startInvite = async()=> {
		try{
			// setRpsStatus(1)
			let response = await axios.post(SEVERURL+"rpsgame/start/invite",{wallet : wallet.publicKey, amount : WAGER_AMOUNTS[selectedAmount] * LAMPORTS_PER_SOL, name : userName})
			if(response.data.response===false){
				openNotification('error',"You can't start game.", "Please check your wallet status and deposit amount")
				// setRpsStatus(0)
				throw new Error("Start game error")
			}
			setInviteId(response.data.data.id)
			setIsInvitePanel(true)
		}catch(err){
			console.log(err)
		}
	}

	const cancelGame = async()=> {
		try{
			let res = await axios.delete(SEVERURL+"rpsgame/cancel/mystery",{data:{wallet : wallet.publicKey}})
			if(res.data.response===false){
				openNotification('error',"You can't cancel game", "You have already matched or started game.")
				throw new Error("cannot cancel")
			}
			// setIsWaiting(false)			
			setRpsStatus(0)
		}catch(err){
			console.log(err)
		}
	}

	const findMatch = async()=> {
		// console.log(rpsStatus)
		// if(rpsStatus!==1) return;
		if(isInviteWaiting){
			await getPlayerStatus()
		}else{
			try{
				let res = await axios.post(SEVERURL+"rpsgame/match",{wallet : wallet.publicKey})
				if(res.data.response===true && res.data.roomID!==0){
					console.log("room created - ", res.data.data.roomID)
					setRoomNumber(res.data.data.roomID)
					setRpsStatus(2)
				}else{
					console.log("not found")
				}
			}catch(err){
				console.log(err)
			}
		}
	}

	const getGameResult = (mySel : number, opSel : number)=>{
		if(mySel===0 || opSel===0) return 0
		if(mySel===opSel) return 0
		if((mySel===1 && opSel===3) || (mySel===2 && opSel===1) || (mySel===3 && opSel===2)) return 1
		return 2
	}

	const getGameState = async()=>{
		// if(rpsStatus!==2) return;
		try{
			if(wallet.connected===false) throw new Error("wallet invalid")
			let res = await axios.post(SEVERURL+'rpsgame/gamestate',{roomId : roomNumber, wallet : wallet.publicKey})
			if(res.data.response === false) throw new Error("Get game state failed")
			let gameState = res.data.data;

			let myShow=0, opShow=0;
			if(gameState.currentTurn===3){
				setIsSelecting(false)
				myShow = gameState.mySelect[2]-1
				opShow = gameState.opSelect[2]-1
			} else if(gameState.currentTurn===2 && gameState.ended===1){
				setIsSelecting(false)
				myShow = gameState.mySelect[1]-1
				opShow = gameState.opSelect[1]-1
			}else{
				if(gameState.mySelect[gameState.currentTurn]>0 && gameState.opSelect[gameState.currentTurn]===0){
					setIsSelecting(false)
					myShow = gameState.mySelect[gameState.currentTurn]-1
					opShow = 3
				}else{
					if(gameState.currentTurn>0){
						myShow = gameState.mySelect[gameState.currentTurn-1]-1
						opShow = gameState.opSelect[gameState.currentTurn-1]-1
					}
				}
			}
			

			let gameResult = [0,0,0]
			for(let i=0; i<3; i++) gameResult[i] = getGameResult(gameState.mySelect[i],gameState.opSelect[i])
			
			setCurrentState({
				...gameState,
				gameResult : gameResult,
				myShow : myShow,
				opShow : opShow,
			})
		}catch(err){
			console.log(err)
		}
	}

	const submitRps = async()=>{
		try{
			await axios.post(SEVERURL+'rpsgame/submit',{roomId : roomNumber, wallet : wallet.publicKey, item : (selectItem+1)})
		}catch(err){
			console.log(err)
		}
	}

	const signMessage = async() => {
		try{
			let token = localStorage.getItem("token")
			if(token!==null){
				try{
					let tokenCheck = await axios.post(SEVERURL+"rpsgame/tokencheck",{wallet : wallet.publicKey, token : token})
					if(tokenCheck.data.response===true){
						axios.defaults.headers.common["x-access-token"] = token
						setIsSigned(true)
						return;
					}
				}catch(err){
					console.log("Prev Token Invalid")
				}
			}

			let response = await axios.post(SEVERURL+"rpsgame/nonce",{wallet : wallet.publicKey})
			if(response.data.response===false){
				throw new Error("Nonce Error")
			}
			let nonce = response.data.nonce
			let message = `Sign this message from authentication with your wallet. Nonce : ${nonce}`
			const data = new TextEncoder().encode(message)
			const signature = bs58.encode(await wallet.signMessage(data))
			let signResponse = await axios.post(SEVERURL+"rpsgame/signin",{wallet : wallet.publicKey, signature : signature})
			console.log(signResponse)
			if(signResponse.data.response===false) throw new Error("sign error")
			axios.defaults.headers.common["x-access-token"] = signResponse.data.data.token
			localStorage.setItem("token", signResponse.data.data.token)
			setIsSigned(true)
		}catch(err){
			console.log(err)
		}
	}

	return <>
	<div className="content text-center">
		{
			openAlert &&
			<Alert severity="info" icon={<WarningAmberRoundedIcon fontSize="inherit"></WarningAmberRoundedIcon>}
				action={
				<IconButton arial-label="close" color="inherit" size="small" onClick={()=>{
					setOpenAlert(false)
				}}>
					<CloseIcon fontSize="inherit"></CloseIcon>
				</IconButton>
				}
				sx={{borderRadius : 0, borderWidth : "1px", mb : 3, width: "100%"}}
			>{CONST_MESSAGES.chainDegradedAlert}</Alert>
		}
		<div className="header">
			<h3>{CONST_MESSAGES.title}</h3>
			<p>{CONST_MESSAGES.subTitle}</p>
		</div>
		{
			wallet.connected===false ?
				<>
					<img src={BettingImage} style={{width:'70%', maxWidth : "600px"}} alt={"betting"}/>
					<p style={{fontSize : "30px"}}>{CONST_MESSAGES.homeTitle}</p>
					<div style={{width:"200px"}}><WalletConnect/></div>
					<div className='mb-5'></div>
					<p style={{fontSize : "24px"}}>RECENT MATCHES</p>
					<Stack sx={{width:'60%'}} spacing={2}>
					{recentLog.map((log,idx)=>{return <LogPanel log={log} key={idx}></LogPanel>})}
					</Stack>
				</>
			:
			isSigned===false ?
				<>
					<img src={BettingImage} style={{width:'70%', maxWidth : "600px"}} alt={"betting"}/>
					<p style={{fontSize : "30px"}}>{CONST_MESSAGES.homeTitle}</p>
					<div style={{width:"200px"}}>
						<button className="btn-invite" onClick={async()=>{
							await signMessage()
						}}>PLAY GAME</button>
					</div>
					<div className='mb-5'></div>
					<p style={{fontSize : "24px"}}>RECENT MATCHES</p>
					<Stack sx={{width:'60%'}} spacing={2}>
					{recentLog.map((log,idx)=>{return <LogPanel log={log} key={idx}></LogPanel>})}
					</Stack>
				</>
			:
				rpsStatus===0 ?
					isInvitePanel===false ?
						<div className="name-wager">
							<h5>ENTER DISPLAY NAME</h5>
							<input type="text" className={isCorrectName ? "" : "invalid-input"} onChange={(event)=>{
								if(event.target.value==="") setIsCorrectName(false)
								else setIsCorrectName(true)
								setUserName(event.target.value)
							}} value={userName}></input>
							<h5 className='p-4'>SELECT YOUR WAGER</h5>
							<div className="row select-group">
							{WAGER_AMOUNTS.map((item,idx)=>{return <div className='col-4' key={idx}><button type="button" className={idx===selectedAmount ? "btn btn-light active" : "btn btn-light"} onClick={()=>{setSelectedAmount(idx)}}>{item} Sol</button></div>})}
							</div>
							<div className='row'>
								<div className='col-6 text-center'>
									<button className="btn-invite" onClick={async ()=>{
										if(userName==="") return;
										localStorage.setItem("userName", userName)
										localStorage.setItem("selectedAmount", selectedAmount.toString())
										await startInvite()
									}}>INVITE FRIEND</button>
								</div>
								<div className="col-6 text-center">
									<button className="btn-mystery" onClick={async ()=>{
										if(userName==="") return;
										localStorage.setItem("userName", userName)
										localStorage.setItem("selectedAmount", selectedAmount.toString())
										await startMystery()
									}}>MYSTERY PLAYER</button>
								</div>
							</div>
						</div>
					:
						<div className='invite-panel'>
							<h2>COPY & SHARE THIS LINK WITH YOUR FRIEND</h2>
							<p className="">{"localhost:3000/invite/"+inviteId}</p>
							<button className="btn-invite mt-5" onClick={()=>{
								setIsInviteWaiting(true)
								setRpsStatus(1)
							}}>Continue</button>
						</div>
				:
					(rpsStatus===1 || rpsStatus===3) ?
						<div className="waiting-room">
							<h2><HourglassBottomIcon fontSize='large'></HourglassBottomIcon>WAITING ROOM</h2>
							<h3>Please do not exit this screen</h3>
							<button className="btn-invite mt-5" onClick={async ()=>{
								await cancelGame()
								setIsInvitePanel(false)
							}}>CANCEL GAME</button>
						</div>
					:
						currentState==null || isSelecting===true ?
							<>
								<img src={lgImage[selectItem]} alt={"Selected"} style={{width:"30%"}}></img>
								<p className="normal-text">I'd LIKE TO PICK</p>
								<div className="row select-rps pt-3">
								{
									RPSNAME.map((item,idx)=>{
										return <div className="col-sm-4" key={idx}>
											<button type="button" className={idx===selectItem ? "btn btn-light active" : "btn btn-light"} onClick={()=>{
												setSelectItem(idx)
											}}>{item}</button>
										</div>
									})
								}
								</div>
								<button className="btn-invite" onClick={async ()=>{
									await submitRps()
									setIsSelecting(false)
									await getGameState()
								}}>SUBMIT</button>
							</>
						:
							<div className='mt-3'>
								<h5>YOU SELECTED</h5>
								<img src={smLeftImage[currentState.myShow]} alt={"you selected"}></img>
								<p>{RPSNAME[currentState.myShow]}</p>
								<h5>YOUR OPPONENT SELECTED</h5>
								{
									currentState.opShow !== 3 ?
										<img src={smRightImage[currentState.opShow]} alt={"you selected"}></img>
									:
										<div className="p-5">
											<CircularProgress color="inherit" size="6rem" disableShrink></CircularProgress>
										</div>
								}
								{
									<p>{RPSNAME[currentState.opShow]}</p>
								}
								<div className='row p-3'>
								{
									currentState.currentTurn !== 3 &&
									(currentState.gameResult as any[]).map((item, idx)=>{
										return <div className='col-4' key={idx}><img src={star[item]} alt={"star"}></img></div>
									})
								}
								</div>
								{
									currentState.opShow !== 3 && currentState.ended !== 1 &&
									<button className="btn-invite" onClick={()=>{
										setIsSelecting(true)
									}}>Next Round</button>
								}
								{
									currentState.ended === 1 &&
									<>
										<p> WON {currentState.amount/(10**9)}SOL!</p>
										<div className="row">
											<div className="col-6 text-center">
												<button className="btn-invite" onClick={async()=>{
													await startMystery()
												}}>PLAY AGAIN</button>
											</div>
											<div className="col-6 text-center">
												<button className="btn-mystery" onClick={async()=>{
													setRpsStatus(0)
													setIsInvitePanel(false)
													setIsSelecting(true)
													setCurrentState(null)
												}}>NEW GAME</button>
											</div>
										</div>
									</>
								}
							</div>
		}
		{wallet.connected && isSigned && <InfoPanel/>}
	</div>
	<Footer/>
	</>
}