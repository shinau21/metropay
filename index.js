const Xendit = require('xendit-node');
const { Telegraf } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
const db = require('mysql');
require('dotenv').config()

// Secret Token
const x = new Xendit({
  secretKey: process.env.SECRET_TOKEN,
});
const bot = new Telegraf(process.env.BOT_TOKEN)
//---------------------------------------------
// Environment Database
const conection = {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
}
const pool = db.createPool(conection);
//------------------------------------


// Admin Fee
const admPayin = process.env.FEE_IN
const admPayout = process.env.FEE_OUT

// Xendit
const { Invoice, Payout} = x;
const invoiceSpecificOptions = {};
const payoutSpecificOptions = {};
const p = new Payout(payoutSpecificOptions);
const i = new Invoice(invoiceSpecificOptions);
const nDate = new Date().toLocaleString('en-US', {timeZone: 'Asia/Jakarta'});

// Function Start
async function getDataByID(ctx){
    try{
        let tid = ctx.message.from.username;
        pool.query(`SELECT * FROM mpay_data WHERE m_telegram='${tid}'`, function (error, results, fields) {
          let data = []
          try{
            for (let res of results){
              data.push(`Name: ${res.m_name}\nBalance: Rp.${res.m_balanceidr}\nAddress: ${res.m_address} ${res.m_section} ${res.m_city}\nSchool: ${res.m_study}\nStatus: ${res.m_status}\nWhatsapp: ${res.m_whatsapp}\nTelegram: ${res.m_telegram}\nEmail: ${res.m_email}\n`)
            }
            ctx.reply(`Metropay Personal Data:\n ${data[0]}\n`);
          } catch(e) {
            ctx.reply(`Database Not Connected`);
          }
        })        
    } catch(e) {

    }
}

// Payout Start Here
async function setPayoutByTel(data,ctx){
  try{
    console.log(data)
    let tid = ctx.from.username
    let curr = parseInt(`${data[0]['amount']}`)
    let adm = parseInt(`${data[0]['amount'] * admPayout}`)
    let total = curr + adm;
    let pdata = []
    pool.query(`SELECT * FROM mpay_data WHERE m_telegram='${tid}'`, function (error, results, fields) {
      for(let res of results){
        pdata.push(res.m_id);
        pdata.push(res.m_balanceidr);
        pdata.push(res.m_telegram);
        pdata.push(res.m_email);
      }

      if(total < pdata[1]){
        createPayout(data,ctx,pdata)
      } else {
        ctx.reply('Your balance is not enough')
      }
    })
  } catch(e) {
    ctx.reply('Database not connected')
  }
}

async function createPayout(data,ctx,pdata){
  try{
    let tid = ctx.from.username;
    let curr = parseInt(`${data[0]['amount']}`)
    let adm = parseInt(`${data[0]['amount'] * admPayout}`)
    let mail = pdata[3]
    let total = curr + adm;
    data.filter(function(x){ return x ==  ctx.callbackQuery.data})
    console.log(data)

    const resp = await p.createPayout({
      externalID: `${nDate}`,
      amount: curr,
      email: mail
    })

    console.log(resp)

    if(pdata[1] > curr){
      sendBalPayout(-total,ctx)
      let cQuery = `INSERT INTO mpay_outvoice (pay_id, pay_amount, pay_url, pay_status, pay_telegram, pay_email) VALUES ('${resp.id}', ${curr}, '${resp.payout_url}', '${resp.status}', '${pdata[2]}', '${pdata[3]}')`
      pool.query(cQuery, function (error, results, fields) {
        if(error) throw error;
      });
      getPayoutByID(ctx,resp.payout_url);
    } else {
      ctx.reply('Your balance is not enough')
    }
  } catch(e) {
    ///
  }
}

function getPayoutByID(ctx){
  console.log(ctx)
  pool.query(`SELECT * FROM mpay_outvoice WHERE pay_telegram='${ctx.from.username}' AND pay_status='PENDING'`, function (error, results, fields) {
    let data = [];
    for (let res of results){
      data.push(Key.url(`WITHDRAW`, `${res.pay_url}`))
      data.push(Key.callback(`CONFIRM`, `validatePay!${res.pay_id}`))
      data.push(Key.callback(`CANCEL`, `cancelPay!${res.pay_id}`))
    }
    const keyboard = Keyboard.make([data]).inline()
    console.log(data)
    // ctx.telegram.sendMessage(ctx.message.chat.id, 'Validating Invoice',keyboard)
    ctx.reply('Click button below to cancel/validation payout',keyboard);
  })  
}

async function validatePayout(id,ctx){
  try{
    const resp = await p.getPayout({
      id: id
    })
      pool.query(`SELECT * FROM mpay_outvoice WHERE pay_id='${id}'`, function (error, results, fields) {
        let data = []
        for (let res of results){
          data.push(res.id)
        }
        setPayout(data[0],ctx,resp.status)
      });
  } catch(e) {
    console.log(e)
  }
}

async function cancelPayout(id,ctx){
  try{
    const resp1 = await p.voidPayout({
      id: id
    })
    const resp = await p.getPayout({
      id: id
    })
    console.log(resp)
    if (resp.status != 'COMPLETED'){
      pool.query(`SELECT * FROM mpay_outvoice WHERE pay_id='${id}'`, function (error, results, fields) {
        let data = []
        try{
          for (let res of results){
            data.push(res.id)
            data.push(res.pay_status)
            data.push(res.pay_amount)
          }
          console.log(data)
          if(data[1] != 'VOIDED'){
            let curr = parseInt(data[2])
            let ncurr = parseInt(data[2] * admPayout)
            let total = curr + ncurr
            failPayout(data[0],total,ctx)
          } else {
            ctx.reply('You already voided payout');
          }
        } catch(e) {
          ctx.reply('Database Not Connected');
        }
      });
    }
  } catch(e) {

  }
}

async function setPayout(id,ctx,status){
  pool.query(`UPDATE mpay_outvoice SET pay_status='${status}' WHERE id='${id}'`, function (error, results1, fields) {
    if(error) throw error
    if(status == 'COMPLETED'){
      ctx.reply('Payout Finished')
    }
    else if(status == 'PENDING'){
      ctx.reply('You need to Withdraw / Cancel')
    }
    else if(status == 'VOIDED'){
      ctx.reply('Your Withdraw has been Voided')
    }
  });
}

async function failPayout(id,balance,ctx){
  pool.query(`UPDATE mpay_outvoice SET pay_status='VOIDED' WHERE id='${id}'`, function (error, results1, fields) {
  });
  sendBalPayout(balance,ctx);
}

async function sendBalPayout(balance,ctx){
  let tid = ctx.callbackQuery.from.username
  pool.query(`SELECT * FROM mpay_data WHERE m_telegram='${tid}'`, function (error, results, fields) {
    let data = [];
    if (error) throw error;
    for (let res of results){
      data.push(res.m_id);
      data.push(res.m_balanceidr);
      data.push(res.m_telegram);
      data.push(res.m_email);
    }
    setBalPayout(data,balance,ctx)
    console.log(data);
  });
}

function setBalPayout(data,balance,ctx){
  let curr = parseInt(`${data[1]}`);
  let fBalance = parseInt(`${balance}`)
  let nBalance = curr + fBalance
  pool.query(`UPDATE mpay_data SET m_balanceidr=${nBalance} WHERE m_id=${data[0]}`, function (error, results1, fields) {
    ctx.reply(`Balance Updated to Rp.${nBalance}`);
    console.log(data)
  });
}
// Payout End Here


// Payin Start Here
async function setPayinByTel(data,ctx){
  try{
    let tid = ctx.from.username
    let curr = parseInt(`${data[0]['price']}`)
    let adm = parseInt(`${data[0]['price'] * admPayin}`)
    let total = curr + adm;
    pool.query(`SELECT * FROM mpay_data WHERE m_telegram='${tid}'`, function (error, results, fields) {
      let pdata = []
      for(let res of results){
        pdata.push(res.m_id);
        pdata.push(res.m_name)
        pdata.push(res.m_address)
        pdata.push(res.m_section)
        pdata.push(res.m_poscode)
        pdata.push(res.m_city)
        pdata.push(res.m_balanceidr);
        pdata.push(res.m_whatsapp);
        pdata.push(res.m_telegram);
        pdata.push(res.m_email);
      }
      createPayin(data,ctx,pdata)
    })
  } catch(e) {
    ctx.reply('Database not connected')
  }
}

async function createPayin(data,ctx,pdata){
  try{
    let curr = parseInt(`${data[0]['price']}`)
    let adm = parseInt(`${data[0]['price'] * 0.02}`)
    let total = curr + adm;
    // data.filter(function(x){ return x == validity[1] })
  
    const resp = await i.createInvoice({
      externalID: nDate,
      amount: total,
      description: `Invoice Metropay @${pdata[8]}#${Math.floor(Math.random() * 9999)}`,
      invoiceDuration: 7200,
      customer: {
        'given_names': `${pdata[1]}`,
        'surname': `${pdata[1]}`,
        'email': `${pdata[9]}`,
        'mobile_number': `${pdata[7]}`,
        'addresses': [
          {
            'city': `${pdata[5]}`,
            'country': 'Indonesia',
            'postal_code': `${pdata[4]}`,
            'state': 'Jawa Tengah',
            'street_line1': `${pdata[2]}, Kecamatan ${pdata[3]}`,
            'street_line2': `Kabupaten ${pdata[5]}, Kode Pos ${pdata[4]}`
          }
        ]
      },
      customerNotificationPreference: {
        'invoice_created': [
          'whatsapp',
          'sms',
          'email',
          'viber'
        ],
        'invoice_reminder': [
          'whatsapp',
          'sms',
          'email',
          'viber'
        ],
        'invoice_paid': [
          'whatsapp',
          'sms',
          'email',
          'viber'
        ],
        'invoice_expired': [
          'whatsapp',
          'sms',
          'email',
          'viber'
        ]
      },
      successRedirectURL: 'https://smknkejobong.sch.id',
      failureRedirectURL: 'https://smknkejobong.sch.id',
      currency: 'IDR',
      items: [
        {
          'name': `${data[0]['name']}`,
          'quantity': 1,
          'price': curr,
          'category': 'Saldo',
          'url': 'https://mpay.smknkejobong.sch.id/product/'
        }
      ],
      fees: [
        {
          'type': 'ADMIN',
          'value': adm
        }
      ]
    })
    let cQuery = `INSERT INTO mpay_invoice (m_invoiceid, m_price, m_url, m_istatus, m_iwhatsapp, m_itelegram, m_email) VALUES ('${resp.id}', ${curr}, '${resp.invoice_url}', '${resp.status}', '${pdata[7]}', '${pdata[8]}', '${pdata[9]}')`
    pool.query(cQuery, function (error, results, fields) {
      if(error) throw error;
    })
    getPayinByID(ctx);
  } catch(e) {
    //
  }
}

async function getPayinByID(ctx){
  try{
    pool.query(`SELECT * FROM mpay_invoice WHERE m_itelegram='${ctx.from.username}' AND m_istatus='PENDING'`, function (error, results, fields) {
      let data = [];
      for (let res of results){
        data.push(Key.url(`DEPOSIT#${res.m_iid}`, `${res.m_url}`))
        data.push(Key.callback(`CONFIRM#${res.m_iid}`, `validatePayin!${res.m_invoiceid}`))
        data.push(Key.callback(`CANCEL`, `cancelPayin!${res.m_invoiceid}`))
      }
      const keyboard = Keyboard.make([data],{columns: 1}).inline()
      // ctx.telegram.sendMessage(ctx.message.chat.id, 'Validating Invoice',keyboard)
      ctx.reply('Click button Deposit\nAfter pay deposit on the url, please click confirm button below to confirm Deposit',keyboard);
      console.log(data)
    })    
  } catch (e) {
    ctx.reply('Database not connected')
  }
}

async function validatePayin(id,ctx){
  try{
    const resp = await i.getInvoice({
      invoiceID: id
    })
    console.log(resp)
    if (resp.status == 'PAID'){
      pool.query(`SELECT * FROM mpay_invoice WHERE m_invoiceid='${id}'`, function (error, results, fields) {
        let data = []
        try{
          for (let res of results){
            data.push(res.m_iid)
            data.push(res.m_invoiceid)
            data.push(res.m_price)
            data.push(res.m_istatus)
          }
          if(data[3] == 'PENDING'){
            setPayin(data[0],data[2],ctx)
          }
          else if(data[3] == 'EXPIRED') {
            ctx.reply('Your payment is expired');
          } else {
            ctx.reply('Your payment is completed')
          }
        } catch(e) {
          ctx.reply('Database Not Connected');
        }
      });
    }
    else if (resp.status == 'PENDING')
    {
      ctx.reply('You need to complete payment validation')
    } else {
      ctx.reply('Click Cancel Button')
    }
  } catch(e) {
    ctx.reply('Database not connected')
  }
}

async function cancelPayin(id,ctx){
  try{
    const resp1 = await i.expireInvoice({
      invoiceID: id
    })
    const resp = await i.getInvoice({
      invoiceID: id
    })
    if (resp.status == 'EXPIRED'){
      pool.query(`SELECT * FROM mpay_invoice WHERE m_invoiceid='${id}'`, function (error, results, fields) {
        let data = []
        try{
          for (let res of results){
            data.push(res.m_iid)
            data.push(res.m_istatus)
          }
          console.log(data)
          if(data[1] == 'PENDING'){
            failPayin(data[0],ctx)
          } else {
            ctx.reply('You already voided payout');
          }
        } catch(e) {
          ctx.reply('Database Not Connected');
        }
      });

    }
  } catch(e) {
    ctx.reply('Databae not connected')
  }
}

async function setPayin(id,balance,ctx){
  pool.query(`UPDATE mpay_invoice SET m_istatus='PAID' WHERE m_iid='${id}'`, function (error, results1, fields) {
    sendBalPayin(balance,ctx)
  });

}

async function failPayin(id,ctx){
  console.log(id)
  pool.query(`UPDATE mpay_invoice SET m_istatus='EXPIRED' WHERE m_iid='${id}'`, function (error, results1, fields) {
    ctx.reply('Your Deposit is voided')
  });
}

async function sendBalPayin(balance,ctx){
  let tid = ctx.callbackQuery.from.username
  pool.query(`SELECT * FROM mpay_data WHERE m_telegram='${tid}'`, function (error, results, fields) {
    let data = [];
    if (error) throw error;
    for (let res of results){
      data.push(res.m_id);
      data.push(res.m_balanceidr);
      data.push(res.m_telegram);
      data.push(res.m_email);
    }
    setBalPayin(data,balance,ctx)
    console.log(data);
  });
}

function setBalPayin(data,balance,ctx){
  let curr = parseInt(`${data[1]}`);
  let fBalance = parseInt(`${balance}`)
  let nBalance = curr + fBalance
  pool.query(`UPDATE mpay_data SET m_balanceidr=${nBalance} WHERE m_id=${data[0]}`, function (error, results1, fields) {
    ctx.reply(`Balance Updated to Rp.${nBalance}`);
    console.log(data)
  });
}
// PayIn End Here

const mainMenuOwner = Keyboard.make([
    ['Personal Information'],['Deposit','Withdraw'],['Invoice','Outvoice'],
]).reply()

const mainMenuUser = Keyboard.make([
  ['Personal Information'],['Deposit','Invoice'],
]).reply()

bot.start(async(ctx) => {
    let owner = process.env.CONFIG_OWNER
    console.log(owner)
    if(ctx.message.from.username == owner){
      return ctx.reply('Welcome to MetroPay SMK NEGERI 1 KEJOBONG', mainMenuOwner)
    } else {
      return ctx.reply('Welcome to MetroPay SMK NEGERI 1 KEJOBONG', mainMenuUser)
    }
})

bot.hears('Personal Information', async(ctx) => {
    getDataByID(ctx);
})

bot.hears('Deposit', async(ctx) => {
    pool.query(`SELECT * FROM mpay_product`, function (error, results, fields) {
        let data = [];
        for (let res of results){
          data.push(Key.callback(`Rp.${res.m_pcode}`, `createPayin!${res.m_pcode}`))
        }
        console.log(data)
        const keyboard = Keyboard.make([data]).inline()
        console.log(keyboard)
        ctx.reply(`Charge MetroPay Balance`,keyboard)
    });
})

bot.hears('Withdraw', async(ctx) => {
  pool.query(`SELECT * FROM mpay_payout`, function (error, results, fields) {
    if(error) throw error;
    let data = [];
    for (let res of results){
      data.push(Key.callback(`Rp.${res.pay_code}`, `createPayout!${res.pay_code}`))
    }
    console.log(data)
    const keyboard = Keyboard.make([data],{columns:1}).inline()
    console.log(keyboard)
    ctx.reply(`List Product`,keyboard)
});
})

bot.hears('Back', async(ctx) => {
    return ctx.reply('Simple Keyboard', mainMenuKeyboard)
})

bot.hears('Invoice', async(ctx) => {
    getPayinByID(ctx)
})

bot.hears('Outvoice', async(ctx) => {
  getPayoutByID(ctx)
})

bot.on('callback_query', async(ctx) => {
  console.log(ctx.from)
  let callback = ctx.callbackQuery.data;
  let validity = callback.split('!')
  if(validity[0] == 'createPayin'){
    console.log(ctx.callbackQuery.data)
    pool.query(`SELECT * FROM mpay_product WHERE m_pcode='${validity[1]}'`, function (error, results, fields) {
      let data = []
      for (let res of results){
        data.push({name:res.m_pname,price:res.m_pprice})
      }
      setPayinByTel(data,ctx)
    });
  }
  else if(validity[0] == 'createPayout'){
    pool.query(`SELECT * FROM mpay_payout WHERE pay_code='${validity[1]}'`, function (error, results, fields) {
      let data = []
      for (let res of results){
        data.push({code:res.pay_code,amount:res.pay_amount})
      }
      setPayoutByTel(data,ctx)
    });  
  }
  else if(validity[0] == 'validatePayin'){
    console.log(callback)
    validatePayin(validity[1],ctx)
  }
  else if(validity[0] == 'cancelPayin'){
    console.log(callback)
    cancelPayin(validity[1],ctx)
  }
  else if(validity[0] == 'validatePay'){
    console.log(callback)
    validatePayout(validity[1],ctx)
  }
  else if(validity[0] == 'cancelPay'){
    console.log(callback)
    cancelPayout(validity[1],ctx)
  }
})

bot.launch()
