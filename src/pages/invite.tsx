import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {WalletConnect, WalletDisconnect} from '../wallet'
import axios from 'axios'
import { CONST_MESSAGES } from '../utils/constant'
import { useWallet } from "@solana/wallet-adapter-react";
import {Alert, Stack, IconButton} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {notification} from 'antd'
import BettingImage from '../assets/image/betting.png'
import LogPanel from '../components/logpanel';
import Footer from '../components/footer'
import InfoPanel from '../components/infopanel';

const SEVERURL = "http://localhost:5000/"
let wallet : any;

export default function Invite(){
	wallet = useWallet()
	const {id} = useParams()
	const prevUserName = localStorage.getItem("userName")

	const [openAlert, setOpenAlert] = useState(true)
	const [userName, setUserName] = useState<string>(prevUserName!==null && prevUserName!==undefined ? prevUserName : "")
	const [isCorrectName, setIsCorrectName] = useState(true)

	const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
		notification[type]({
			message : title, description : description, placement : 'topLeft'
		})
	}

	const acceptInvitation = async()=>{
		try{
			let response = await axios.post(SEVERURL+"rpsgame/accept", {wallet : wallet.publicKey, name : userName, inviteId : id})
			if(response.data.response===true){
				window.location.href = "/"
			}else{
				openNotification('error', "You can't accept invitation")
			}
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
					</Stack>
				</>
			:
				<div className="name-wager">
					<h5>ENTER DISPLAY NAME</h5>
					<input type="text" className={isCorrectName ? "" : "invalid-input"} onChange={(event)=>{
						if(event.target.value==="") setIsCorrectName(false)
						else setIsCorrectName(true)
						setUserName(event.target.value)
					}} value={userName}></input>
					<button className="btn-invite mt-5" onClick={async ()=>{
						await acceptInvitation()
					}}>Continue</button>
				</div>
		}
		{wallet.connected && <InfoPanel></InfoPanel>}
	</div>
	<Footer/>
	</>
}