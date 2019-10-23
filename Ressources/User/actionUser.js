//********Modules************/


//pour controler les inputs du password
const Joi    = require('joi')
const User = require('./modelUser')
const passport = require('passport')
const randomstring = require('randomstring')
const userSchema = Joi.object().keys({
    email : Joi.string().email().required(),
    username : Joi.string().required(),
    password : Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
    confirmationPassword : Joi.any().valid(Joi.ref('password')).required()
})

module.exports = {
//===========Cette methode permet d'ajouter un utlisateur ds la BDD========
//=========================================================================
    async registerUser(req, res,next){
        try{


            console.log('req.body',req.body)
            const result = Joi.validate(req.body,userSchema)
            console.log('result',result)

            if(result.error){
                req.flash('error','Données non valide, essayer une nouvelle fois s\'il vous plait.')
                res.redirect('/users/register')
                return
            }
            //vérification l'existance du mail
        const user = await User.findOne({'email':result.value.email})
            if (user){
                req.flash('error','Email existe déja')
                res.redirect('/users/register')
                return
            }

            //Cryptage du password
            const hash = await User.hashPassword(result.value.password)
            //console.log('hash',hash)

            //generation du secret token
            const secretToken = randomstring.generate()
            result.value.secretToken = secretToken

            // flag le compte comme inactive
            result.value.active = false

            //Enregistrer utilisateur dans la BD
            delete result.value.confirmationPassword
            result.value.password = hash
            console.log('new value ',result.value)

            const newUser = await new User(result.value)
            console.log('newUser',newUser)
            await newUser.save()
            req.flash('success','Données valide, bravo.')
             res.redirect('/users/login')

            return
        }catch(error){
            next(error)
        }
    },
    async verifyUser(req, res,next){
        try {


            const {secretToken} = req.body

            //chercher le compte qui matche avec ce secretToken
            const user = await User.findOne({'secretToken': secretToken})
            if (!user) {
                req.flash('error', 'aucun utilisateur trouvé')
                res.redirect('verify');
                return
            }
            user.active = true
            user.secretToken = '';
            await user.save()
            req.flash('success', 'Merci ! maintenant vous pouvez vous connecter')
            res.redirect('login')
        } catch (error) {
            next(error)
        }
    }
}






