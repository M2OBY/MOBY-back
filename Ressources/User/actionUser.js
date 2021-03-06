//********************************************** */
// Ce fichier traite les requetes reçus par routeUser
//Pour les envoyer vers le fichier processUser
//*********************************************** */

//********Modules************/
//pour controler les inputs du password
const Joi    = require('joi')
const bcrypt = require('bcryptjs');
const User = require('./modelUser')
const processUser = require('./processUsers')
//const jwt = require('jsonwebtoken');
const randomstring = require('randomstring')
const mailer = require('../../misc/mailer')
const mailHTML = require('./mailRegistration')
//const isAuth = require('../../config/middleware')
//const secret = require('../../config/secret').secretKey;
const secret = 'mysecretsshhh';
const userSchema = Joi.object().keys({
      email : Joi.string().email().required(),
      username : Joi.string().required(),
      password : Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
      confirmationPassword : Joi.any().valid(Joi.ref('password')).required()
})


module.exports = {
//===========Cette methode permet d'ajouter un utlisateur ds la BDD========
//=========================================================================
    registerUser: async function (req, res, next) {
        try {


            console.log('req.body', req.body)
            const result = Joi.validate(req.body, userSchema)
            console.log('result', result)

            if (result.error) {
    
                res.format ({
                    'application/json': function() {
                        res.status(406).send('Données non valide, essayer une nouvelle fois s\'il vous plait.');
                    },'text/html': function() {
                        req.flash('error', 'Données non valide, essayer une nouvelle fois s\'il vous plait.')
                        res.redirect('/users/register')
                    }})
                return
            }
            let userExist = false
            //vérification l'existance du mail
             await processUser.verifUser({email:result.value.email})
                .then((retour)=>{
                    if(retour){
                        res.format ({
                            'application/json': function() {
                                res.status(406).send('error : Email existe déja');
                            },'text/html': function() {
                                console.log('resultat verification mail',retour)
                        req.flash('error', 'Email existe déja')
                        res.redirect('/users/register')
                            }})
                       
                        userExist = true
                        return
                    }

                })
                .catch((typeErr)=>{
                  if(typeErr){
                      res.status(400).json({
                          "message" : typeErr
                      })
                      return
                  }

                })


            if(userExist) return userExist
            console.log('userExist',userExist)
            //Cryptage du password
            const hash = await User.hashPassword(result.value.password)
            //console.log('hash',hash)

            //generation du secret token
            const secretToken = randomstring.generate()
            result.value.secretToken = secretToken

            // flag le compte est inactive
            result.value.active = false

            //Enregistrer utilisateur dans la BD
            delete result.value.confirmationPassword
            result.value.password = hash
            console.log('new value ', result.value)

            //const newUser = await new User(result.value)
               await processUser.creerUser(result.value)
                .then(  (retour)=>{
                    if(retour){
                        //console.log('ressss',res)
                        req.flash('success', 'verifier votre mail sil vous plait.')
                        res.redirect('/users/login')
                    }


                })
                .catch((error)=>{
                    if(error){
                        res.status(400).json({
                            "message" : error
                        })
                        
                    }


                })


           console.log('mailsender', mailHTML.preparationHTML((secretToken)))

            const mail =  mailer.sendEmail('wadica2@hotmail.fr',result.value.email, '[MOBY] verification mail', mailHTML.preparationHTML((secretToken)))
            //const mail =  mailer.sendEmail('mdoubobobarry07ca@gmail.com',result.value.email, '[MOBY] verification mail', mailHTML.preparationHTML((secretToken)))

           console.log('mail', mail)

        } catch (error) {
            if(error){
                res.status(400).json({
                    "message" : error
                })
            }
            next(error)
        }
    },
//****************************************** */
//Cette fonction permet d'afficher un profil   
async affichageProfil (req,res,next){
    try{

        let user= await processUser.affichageUser(req.body.email)
            .then((data)=>{
                if(data!=null){
                    console.log("data",data)
                    res.format ({
                        'application/json': function() {
                            res.send({ data: data });
                        }
                    });

                }

            })


        return user

    }catch (error) {
        res.status(400).json({
            "message" : error
        })
        next(error)
    }
},

//****************************************** */
//Cette fonction permet de vérifier l'adresse mail
//de l'utilisateur
    async verifyUser(req, res,next){
        try {


            const secretToken = req.body.secretToken
            console.log("token",req.body.secretToken)
            //chercher le compte qui matche avec ce secretToken
            const user = await User.findOne({'secretToken': secretToken.trim()})

            if (!user) {
                res.format ({
                    'application/json': function() {
                        res.status(404).send('error aucun utilisateur trouvé');
                    },'text/html': function() {
                        console.log('resultat verification mail',retour)
                        req.flash('error', 'aucun utilisateur trouvé')
                        res.redirect('verify');
                    }})

               
                return
            }
            user.active = true
            //user.secretToken = '';
            await user.save()

            res.format ({
                'application/json': function() {
                    res.status(200).send('success Merci ! maintenant vous pouvez vous connecter');
                },'text/html': function() {
                   
                    req.flash('success', 'Merci ! maintenant vous pouvez vous connecter')
                    res.redirect('login')
                }})

        } catch (error) {
            res.status(400).json({
                "message" : error
            })
            next(error)
        }
    },

//****************************************************** */
//Cette fonction permet de désactiver un compte utilisateur
    desactiverCompte : async function(req,res){
        let userID = req.user.id
        console.log('id user function update ::', userID)
        processUser.desactiverCompte(userID);
        //res.json({message: 'Compte désactivé'})
        req.logout()
        res.format ({
            'application/json': function() {
                res.status(200).send('success Compte desactivé avec succès ! ');
            },'text/html': function() {
               
                req.flash('success', 'Compte desactivé avec succès ! ')

                res.redirect('/')
            }})

        
    },
//****************************************************** */
//Cette fonction permet de mettre à jour les informations
//d'un utilisateur
    updateCompte : async function(req,res,next){
        try{


      
        let userID = req.user.id
        console.log("Profile::", req.body)
        console.log('id user function update ::', userID)
        console.log('req.body', req.body)

        const compte = await processUser.updateCompte(userID, req.body).then((data)=>{
            
            req.flash('success', 'Merci ! Mise à jour profil avec succès')
        });
       
        res.format ({
            'application/json': function() {
                res.status(200).send('success Merci ! Mise à jour profil avec succès');
            },'text/html': function() {
               
                res.redirect('/users/profil');
            }})
        
       
        //res.send(compte);
    }catch(error){
        res.status(400).json({
            "message" : error
        })
        next(error)
    }
    },  


}







