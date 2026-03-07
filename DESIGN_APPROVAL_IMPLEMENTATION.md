# Design Approval System Implementation

## Objectif
Implémenter un système d'approbation/rejet pour les designs 3D créés par l'admin et envoyés aux utilisateurs.

## Scénario Complet

### 1. User envoie design request ✅ (Déjà fait)
- User crée une demande via DesignAssistance.tsx
- Conversation automatiquement créée

### 2. Admin reçoit la demande ✅ (Déjà fait)
- Visible dans AdminDesignAssistance.tsx
- Admin peut communiquer via conversation

### 3. Admin envoie le fichier 3D ✅ (Déjà fait)
- Admin peut uploader un fichier via la conversation
- Le fichier est attaché au message

### 4. User voit le design et peut l'approuver/rejeter (À IMPLÉMENTER)
- **Voir le fichier 3D en preview uniquement** (pas de téléchargement)
- **Bouton "Approve"** → Redirige vers paiement
- **Bouton "Reject"** → Bloque l'accès au fichier, peut donner une raison

## Modifications Nécessaires

### Backend

#### 1. Migration SQL ✅ FAIT
Fichier: `SQL/add-design-approval-system.sql`
- Ajoute `user_approval_status` (pending/approved/rejected)
- Ajoute `user_approval_at`
- Ajoute `user_rejection_reason`

#### 2. Model DesignRequest ✅ FAIT
Fichier: `server/src/models/DesignRequest.ts`
- Ajout du type `ApprovalStatus`
- Ajout des champs dans l'interface `IDesignRequest`

#### 3. Service DesignRequest ✅ FAIT
Fichier: `server/src/services/designRequest.service.ts`
- Méthode `approveDesign(id: string)`
- Méthode `rejectDesign(id: string, reason?: string)`

#### 4. Controller DesignRequest ✅ FAIT
Fichier: `server/src/controllers/designRequest.controller.ts`
- Route `POST /api/design-requests/:id/approve`
- Route `POST /api/design-requests/:id/reject`

#### 5. Routes ✅ FAIT
Fichier: `server/src/routes/designRequest.routes.ts`
- Ajout des routes approve/reject

### Frontend

#### 1. Page DesignAssistance.tsx (À MODIFIER)
**Modifications nécessaires :**

a) **Détecter les fichiers 3D dans les messages**
   - Parser les `attachments` des messages
   - Identifier les fichiers 3D (.stl, .obj, .3mf)
   - Afficher uniquement les fichiers de l'admin

b) **Afficher le ModelViewer**
   ```tsx
   {message.attachments && message.attachments.filter(att => 
     att.type === '3d_model' && att.url
   ).map(attachment => (
     <div key={attachment.url} className="mt-3 p-4 bg-gray-800 rounded-lg">
       <div className="flex items-center justify-between mb-2">
         <span className="text-cyan-400 font-semibold">
           🎨 Design File Ready for Review
         </span>
         <Badge className={getApprovalStatusBadge()}>
           {designRequest.user_approval_status}
         </Badge>
       </div>
       
       {/* ModelViewer (preview only, no download) */}
       <div className="border-2 border-gray-700 rounded-lg overflow-hidden">
         <ModelViewerUrl fileUrl={attachment.url} />
       </div>

       {/* Approval Buttons (only if pending) */}
       {designRequest.user_approval_status === 'pending' && (
         <div className="flex gap-3 mt-4">
           <Button 
             onClick={() => handleApproveDesign(designRequest.id)}
             className="flex-1 bg-green-600 hover:bg-green-700"
           >
             <Check className="w-4 h-4 mr-2" />
             Approve & Pay
           </Button>
           <Button 
             onClick={() => setShowRejectDialog(true)}
             variant="outline"
             className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
           >
             <X className="w-4 h-4 mr-2" />
             Reject
           </Button>
         </div>
       )}

       {/* If approved */}
       {designRequest.user_approval_status === 'approved' && (
         <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
           <p className="text-green-400 text-sm">
             ✓ Design approved! Proceed to payment.
           </p>
           <Button 
             onClick={() => handleProceedToPayment(designRequest)}
             className="w-full mt-2 bg-green-600 hover:bg-green-700"
           >
             Proceed to Payment
           </Button>
         </div>
       )}

       {/* If rejected */}
       {designRequest.user_approval_status === 'rejected' && (
         <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
           <p className="text-red-400 text-sm">
             ✗ Design rejected. Reason: {designRequest.user_rejection_reason || 'Not specified'}
           </p>
         </div>
       )}
     </div>
   ))}
   ```

c) **Ajouter les handlers**
   ```tsx
   const handleApproveDesign = async (requestId: string) => {
     try {
       const token = localStorage.getItem('accessToken');
       const response = await fetch(
         `${API_URL}/design-requests/${requestId}/approve`,
         {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${token}`
           }
         }
       );

       if (response.ok) {
         toast.success('Design approved! You can now proceed to payment.');
         fetchDesignRequests(); // Refresh data
       } else {
         throw new Error('Failed to approve design');
       }
     } catch (error) {
       toast.error('Failed to approve design');
     }
   };

   const handleRejectDesign = async (requestId: string, reason: string) => {
     try {
       const token = localStorage.getItem('accessToken');
       const response = await fetch(
         `${API_URL}/design-requests/${requestId}/reject`,
         {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ reason })
         }
       );

       if (response.ok) {
         toast.success('Design rejected');
         setShowRejectDialog(false);
         fetchDesignRequests();
       } else {
         throw new Error('Failed to reject design');
       }
     } catch (error) {
       toast.error('Failed to reject design');
     }
   };

   const handleProceedToPayment = (request: DesignRequest) => {
     // Store request data in sessionStorage
     sessionStorage.setItem('designPaymentData', JSON.stringify({
       requestId: request.id,
       amount: request.final_price || request.estimated_price,
       projectName: request.project_name
     }));
     
     // Navigate to checkout
     navigate('/checkout?type=design&id=' + request.id);
   };
   ```

d) **Dialog de rejet**
   ```tsx
   const [showRejectDialog, setShowRejectDialog] = useState(false);
   const [rejectionReason, setRejectionReason] = useState('');

   <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
     <DialogContent className="bg-gray-900 border-gray-800">
       <DialogHeader>
         <DialogTitle className="text-red-400">Reject Design</DialogTitle>
         <DialogDescription>
           Please provide a reason for rejecting this design.
         </DialogDescription>
       </DialogHeader>
       <Textarea
         value={rejectionReason}
         onChange={(e) => setRejectionReason(e.target.value)}
         placeholder="Explain what you'd like changed..."
         className="bg-gray-800 border-gray-700 text-white min-h-24"
       />
       <DialogFooter>
         <Button 
           variant="ghost" 
           onClick={() => setShowRejectDialog(false)}
         >
           Cancel
         </Button>
         <Button 
           onClick={() => handleRejectDesign(selectedRequest.id, rejectionReason)}
           className="bg-red-600 hover:bg-red-700"
           disabled={!rejectionReason.trim()}
         >
           Reject Design
         </Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ```

#### 2. AdminDesignAssistance.tsx
**Afficher le statut d'approbation:**
- Badge indiquant si le user a approuvé/rejeté
- Si rejeté, afficher la raison

#### 3. Checkout.tsx (À MODIFIER)
**Support des paiements pour design requests:**
- Détecter `?type=design&id=xxx` dans l'URL
- Charger les données de design depuis sessionStorage
- Traiter le paiement pour un design request

## Ordre d'Implémentation

1. ✅ Migration SQL
2. ✅ Backend (Model, Service, Controller, Routes)
3. Frontend User (DesignAssistance.tsx)
4. Frontend Admin (AdminDesignAssistance.tsx - affichage statut)
5. Checkout integration

## Tests

### 1. Scénario Complet
1. User crée design request
2. Admin voit la demande
3. Admin communique via conversation
4. Admin upload fichier 3D dans la conversation
5. User voit le fichier 3D en preview
6. User clique "Approve" → redirigé vers paiement
7. OU User clique "Reject" → donne raison → admin notifié

### 2. Tests de Sécurité
- User ne peut pas télécharger le fichier sans approbation
- User ne peut approuver que ses propres designs
- Admin peut voir statut d'approbation

## Notes Importantes

- **Pas de téléchargement avant approbation**: Le ModelViewerUrl doit afficher le fichier mais pas permettre de téléchargement
- **Bloquer l'accès si rejeté**: Si rejected, masquer/griser le viewer
- **Un seul approve/reject**: Une fois fait, ne plus permettre de changer (ou avec confirmation admin)

## Fichiers Modifiés

### Backend ✅
- SQL/add-design-approval-system.sql
- server/src/models/DesignRequest.ts
- server/src/services/designRequest.service.ts
- server/src/controllers/designRequest.controller.ts
- server/src/routes/designRequest.routes.ts

### Frontend (À faire)
- client/src/pages/DesignAssistance.tsx
- client/src/pages/admin/AdminDesignAssistance.tsx
- client/src/pages/Checkout.tsx (optionnel, pour paiement design)
